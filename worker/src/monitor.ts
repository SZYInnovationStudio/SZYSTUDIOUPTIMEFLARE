import { MonitorTarget } from '../../types/config'
import { withTimeout, fetchTimeout } from './util'

/**
 * HTTP响应基础校验
 * @param monitor 监控目标配置
 * @param code 响应状态码
 * @param bodyReader 响应体读取函数
 * @returns 错误信息（校验失败）或null（校验通过）
 */
async function httpResponseBasicCheck(
  monitor: MonitorTarget,
  code: number,
  bodyReader: () => Promise<string>
): Promise<string | null> {
  // 校验响应状态码是否符合预期
  if (monitor.expectedCodes) {
    if (!monitor.expectedCodes.includes(code)) {
      return `预期状态码：${JSON.stringify(monitor.expectedCodes)}，实际收到：${code}`
    }
  } else {
    if (code < 200 || code > 299) {
      return `预期状态码：2xx 系列，实际收到：${code}`
    }
  }

  // 校验响应体关键词（包含/禁止包含）
  if (monitor.responseKeyword || monitor.responseForbiddenKeyword) {
    // 仅在需要校验关键词时读取响应体
    const responseBody = await bodyReader()

    // 必须包含指定关键词
    if (monitor.responseKeyword && !responseBody.includes(monitor.responseKeyword)) {
      console.log(
        `${monitor.name} 预期包含关键词 ${
          monitor.responseKeyword
        }，但响应中未找到（内容截断至100字符）：${responseBody.slice(0, 100)}`
      )
      return "HTTP响应未包含配置的关键词"
    }

    // 禁止包含指定关键词
    if (
      monitor.responseForbiddenKeyword &&
      responseBody.includes(monitor.responseForbiddenKeyword)
    ) {
      console.log(
        `${monitor.name} 检测到禁止关键词 ${
          monitor.responseForbiddenKeyword
        }，响应中已找到（内容截断至100字符）：${responseBody.slice(0, 100)}`
      )
      return 'HTTP响应包含配置的禁止关键词'
    }
  }

  return null
}

/**
 * 通过GlobalPing API获取监控状态（全球节点检测）
 * @param monitor 监控目标配置
 * @returns 包含检测节点位置和状态（延迟/是否可用/错误信息）的对象
 */
export async function getStatusWithGlobalPing(
  monitor: MonitorTarget
): Promise<{ location: string; status: { ping: number; up: boolean; err: string } }> {
  // 待办：当GlobalPing API调用出错时应抛出异常
  try {
    if (monitor.checkProxy === undefined) {
      throw "GlobalPing检测代理配置为空，不应调用此方法"
    }

    const gpUrl = new URL(monitor.checkProxy)
    if (gpUrl.protocol !== 'globalping:') {
      throw 'GlobalPing检测代理协议错误，实际收到：' + gpUrl.protocol
    }

    const token = gpUrl.hostname
    let globalPingRequest = {}

    // TCP Ping检测逻辑
    if (monitor.method === 'TCP_PING') {
      // 拼接虚拟https://前缀以解析主机名和端口
      const targetUrl = new URL('https://' + monitor.target)
      globalPingRequest = {
        type: 'ping',
        target: targetUrl.hostname,
        locations:
          gpUrl.searchParams.get('magic') !== null
            ? [
                {
                  magic: gpUrl.searchParams.get('magic'),
                },
              ]
            : undefined,
        measurementOptions: {
          port: targetUrl.port,
          packets: 1, // 发送数据包数量
          protocol: 'tcp', // 待办：是否支持icmp协议？
          ipVersion: Number(gpUrl.searchParams.get('ipVersion') || 4), // IP协议版本（默认IPv4）
        },
      }
    } else {
      // HTTP检测逻辑
      const targetUrl = new URL(monitor.target)
      if (monitor.body !== undefined) {
        throw '暂不支持自定义请求体'
      }
      if (monitor.method && !['GET', 'HEAD', 'OPTIONS'].includes(monitor.method.toUpperCase())) {
        throw '仅支持GET、HEAD、OPTIONS请求方法'
      }
      globalPingRequest = {
        type: 'http',
        target: targetUrl.hostname,
        locations:
          gpUrl.searchParams.get('magic') !== null
            ? [
                {
                  magic: gpUrl.searchParams.get('magic'),
                },
              ]
            : undefined,
        measurementOptions: {
          request: {
            method: monitor.method,
            path: targetUrl.pathname,
            query: targetUrl.search === '' ? undefined : targetUrl.search,
            headers: Object.fromEntries(
              Object.entries(monitor.headers ?? {}).map(([key, value]) => [key, String(value)])
            ), // 待办：是否需要处理Host头？
          },
          // 端口处理（默认80/443）
          port:
            targetUrl.port === ''
              ? targetUrl.protocol === 'http:'
                ? 80
                : 443
              : Number(targetUrl.port),
          protocol: targetUrl.protocol.replace(':', ''), // 提取协议名（http/https）
          ipVersion: Number(gpUrl.searchParams.get('ipVersion') || 4), // IP协议版本（默认IPv4）
        },
      }
    }

    const startTime = Date.now()
    console.log(`请求Global Ping API，请求体：${JSON.stringify(globalPingRequest)}`)
    // 调用GlobalPing API创建检测任务（5秒超时）
    const measurement = await fetchTimeout('https://api.globalping.io/v1/measurements', 5000, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token, // 身份验证令牌
      },
      body: JSON.stringify(globalPingRequest),
    })
    const measurementResponse = (await measurement.json()) as any

    // 检查API响应状态（202表示任务创建成功）
    if (measurement.status !== 202) {
      throw measurementResponse.error.message
    }

    const measurementId = measurementResponse.id
    console.log(
      `检测任务创建成功，任务ID：${measurementId}，耗时：${
        Date.now() - startTime
      }毫秒`
    )

    // 轮询获取检测结果
    const pollStart = Date.now()
    let measurementResult: any
    while (true) {
      // 轮询超时控制（配置超时时间+2秒缓冲）
      if (Date.now() - pollStart > (monitor.timeout ?? 10000) + 2000) {
        throw 'API轮询超时'
      }

      // 获取检测结果（5秒超时）
      measurementResult = (await (
        await fetchTimeout(`https://api.globalping.io/v1/measurements/${measurementId}`, 5000)
      ).json()) as any
      // 任务完成则退出轮询
      if (measurementResult.status !== 'in-progress') {
        break
      }

      // 未完成则等待1秒后重试
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    console.log(
      `检测任务${measurementId}已完成，响应：${JSON.stringify(
        measurementResult
      )}，轮询耗时：${Date.now() - pollStart}毫秒`
    )

    // 检查检测任务是否成功完成
    if (
      measurementResult.status !== 'finished' ||
      measurementResult.results[0].result.status !== 'finished'
    ) {
      console.log(
        `检测任务失败，状态：${measurementResult.status}，结果状态：${measurementResult.results[0].result.status}`
      )
      // 截断原始输出避免错误信息过长
      throw `状态 [${measurementResult.status}|${
        measurementResult.results[0].result.status
      }]：${measurementResult.results?.[0].result?.rawOutput?.slice(0, 64)}`
    }

    // 提取检测节点位置信息
    const country = measurementResult.results[0].probe.country
    const city = measurementResult.results[0].probe.city

    // TCP Ping结果处理
    if (monitor.method === 'TCP_PING') {
      const time = Math.round(measurementResult.results[0].result.stats.avg) // 平均延迟（四舍五入）
      return {
        location: country + '/' + city, // 节点位置（国家/城市）
        status: {
          ping: time,
          up: true,
          err: '',
        },
      }
    } else {
      // HTTP检测结果处理
      const time = measurementResult.results[0].result.timings.total // 总响应时间
      const code = measurementResult.results[0].result.statusCode // 响应状态码
      const body = measurementResult.results[0].result.rawBody // 原始响应体

      // 执行HTTP响应基础校验
      let err = await httpResponseBasicCheck(monitor, code, () => body)
      if (err !== null) {
        console.log(`${monitor.name} 响应校验未通过：${err}`)
      }

      // TLS证书校验（HTTPS目标）
      if (
        monitor.target.toLowerCase().startsWith('https') &&
        !measurementResult.results[0].result.tls.authorized
      ) {
        console.log(
          `${monitor.name} TLS证书不受信任：${measurementResult.results[0].result.tls.error}`
        )
        err = 'TLS证书不受信任：' + measurementResult.results[0].result.tls.error
      }

      return {
        location: country + '/' + city,
        status: {
          ping: time,
          up: err === null, // 无错误则视为可用
          err: err ?? '',
        },
      }
    }
  } catch (e: any) {
    console.log(`Globalping检测${monitor.name}出错：${e}`)
    return {
      location: 'ERROR',
      status: {
        // 超时则ping值为配置的超时时间，否则为0
        ping: e.toString().toLowerCase().includes('timeout') ? monitor.timeout ?? 10000 : 0,
        up: false,
        err: 'Globalping错误：' + e.toString(),
      },
    }
  }
}

/**
 * 获取监控目标状态（本地检测）
 * @param monitor 监控目标配置
 * @returns 包含延迟、可用性、错误信息的状态对象
 */
export async function getStatus(
  monitor: MonitorTarget
): Promise<{ ping: number; up: boolean; err: string }> {
  // 初始化默认状态
  let status = {
    ping: 0,
    up: false,
    err: '未知错误',
  }

  const startTime = Date.now()

  // TCP端口检测逻辑
  if (monitor.method === 'TCP_PING') {
    try {
      // 导入Cloudflare Sockets（Webpack忽略此导入）
      const connect = await import(/* webpackIgnore: true */ 'cloudflare:sockets').then(
        (sockets) => sockets.connect
      )
      // 拼接虚拟https://前缀以解析主机名和端口
      const parsed = new URL('https://' + monitor.target)
      // 建立TCP连接
      const socket = connect({ hostname: parsed.hostname, port: Number(parsed.port) })

      // 等待连接建立（带超时控制）
      await withTimeout(monitor.timeout || 10000, socket.opened)
      // 连接成功后关闭
      await socket.close()

      console.log(`${monitor.name} 成功连接到 ${monitor.target}`)

      status.ping = Date.now() - startTime
      status.up = true
      status.err = ''
    } catch (e: Error | any) {
      console.log(`${monitor.name} 出错：${e.name}：${e.message}`)
      if (e.message.includes('timed out')) {
        status.ping = monitor.timeout || 10000
      }
      status.up = false
      status.err = `${e.name}：${e.message}`
    }
  } else {
    // HTTP端点检测逻辑
    try {
      // 构建请求头（默认添加User-Agent）
      let headers = new Headers(monitor.headers as any)
      if (!headers.has('user-agent')) {
        headers.set('user-agent', 'UptimeFlare/1.0 (+https://github.com/lyc8503/UptimeFlare)')
      }

      // 发送HTTP请求（带超时控制）
      const response = await fetchTimeout(monitor.target, monitor.timeout || 10000, {
        method: monitor.method,
        headers: headers,
        body: monitor.body,
        cf: {
          // 禁用所有状态码的缓存（100-599）
          cacheTtlByStatus: {
            '100-599': -1, // 参考：https://developers.cloudflare.com/workers/runtime-apis/request/#requestinitcfproperties
          },
        },
      })

      console.log(`${monitor.name} 响应状态码：${response.status}`)
      status.ping = Date.now() - startTime

      // 执行HTTP响应基础校验
      const err = await httpResponseBasicCheck(
        monitor,
        response.status,
        response.text.bind(response)
      )
      if (err !== null) {
        console.log(`${monitor.name} 响应校验未通过：${err}`)
      }
      status.up = err === null
      status.err = err ?? ''
    } catch (e: any) {
      console.log(`${monitor.name} 出错：${e.name}：${e.message}`)
      if (e.name === 'AbortError') {
        // 请求超时处理
        status.ping = monitor.timeout || 10000
        status.up = false
        status.err = `超时（${status.ping}毫秒）`
      } else {
        status.up = false
        status.err = `${e.name}：${e.message}`
      }
    }
  }

  return status
}

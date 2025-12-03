import { Divider } from '@mantine/core'
import { pageConfig } from '@/uptime.config'

export default function Footer() {
  const defaultFooter =
    '<p style="text-align: center; font-size: 12px; margin-top: 10px;"> 托管于 <a href="https://www.szystudio.cn" target="_blank">SZY创新工作室</a>,  <a href="https://www.szyd.fun" target="_blank">ShiZhongyan🍭</a>制作</p>'

  return (
    <>
      <Divider mt="lg" />
      <div dangerouslySetInnerHTML={{ __html: pageConfig.customFooter ?? defaultFooter }} />
    </>
  )
}

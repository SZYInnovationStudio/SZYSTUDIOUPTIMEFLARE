# ✔[UptimeFlare ZHCN](https://github.com/lyc8503/UptimeFlare)

一个具体的部署教程

由Zhaorui编写

如有不足之处，欢迎提交Issue!
## 1.准备工作
- Cloudflare 账号
- github账户
- 域名x1（可选，cf自带）
## Go！
-1.获得 api 令牌
![图片](https://free.picui.cn/free/2026/07/11/6a5128dab2f0d.png)
![图片](https://free.picui.cn/free/2026/07/11/6a512926727a8.png)
![图片](https://free.picui.cn/free/2026/07/11/6a5129883cd01.png)
![图片](https://free.picui.cn/free/2026/07/11/6a5129b9a239f.png)
![图片](https://free.picui.cn/free/2026/07/11/6a5129e30f210.png)
![图片](https://free.picui.cn/free/2026/07/11/6a512a368b0ca.png)
-2.github配置
你需要Fork本仓库（不放图片了）
之后，在setings- secrets and variables-第一个选项- new repo secret
![图片](https://free.picui.cn/free/2026/07/11/6a512b94d1464.png)
Name 的值是 CLOUDFLARE_API_TOKEN ③ Secret 的值是在CF获得的 Token 值
![图片](https://free.picui.cn/free/2026/07/11/6a512bd748f89.png)
回到仓库主页，点击 Action 点一下绿色的框框，就不用管了
添加！
-3.改为自己的网站
在git仓库列表中你会看见名为uptime.config.ts的文件
找到  title: "xxx服务器状态",    (行，10) 修改
找到  27-35行 按需求修改
![图片](https://free.picui.cn/free/2026/07/11/6a512d206c8be.png)
保存
自动流生效部署，去cf的 worker and pages 刷新下，会有链接
[END]
##有用就给项目点个star吧，求求了！！！

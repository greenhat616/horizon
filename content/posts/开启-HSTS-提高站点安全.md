---
title: '开启 HSTS, 提高站点安全'
authorLink: https://i.a632079.me
lastmod: '2018-05-26T22:11:50+08:00'
date: 2018-05-26T22:11:50+08:00
slug: hsts
tags: ['hsts', '站点安全']
categories: 技术分享
featured_image: https://piccdn.freejishu.com/images/2016/04/04/1173415.jpg
---
![alt](https://imgcdn.a632079.me/uploads/2018/05/TIM截图20180526221658.png)

目前咱站点已经开启全站 HSTS, 并且通过 HSTS Preload List 了。 庆祝， 撒花~
这是咱的分析报告: [https://www.ssllabs.com/ssltest/analyze.html?d=a632079.me](https://www.ssllabs.com/ssltest/analyze.html?d=a632079.me)

## HSTS 是啥？
### 缘起： HTTPS 也不安全
有不少网站只通过 HTTPS 对外提供服务，但用户在访问某个网站的时候，在浏览器里却往往直接输入网站域名（例如: www.example.com），而不是输入完整的URL（例如https://www.example.com），不过浏览器依然能正确的使用 HTTPS 发起请求。这背后多亏了服务器和浏览器的协作，如下图所示。  
![alt](https://imgcdn.a632079.me/uploads/2018/05/1968_bc295c8a2cd2e261.png)  

简单来讲就是，浏览器向网站发起一次 HTTP 请求，在得到一个重定向响应后，发起一次 HTTPS 请求并得到最终的响应内容。所有的这一切对用户而言是完全透明的，所以在用户眼里看来，在浏览器里直接输入域名却依然可以用 HTTPS 协议和网站进行安全的通信，是个不错的用户体验。

一切看上去都是那么的完美，但其实不然，由于在建立起 HTTPS 连接之前存在一次明文的 HTTP 请求和重定向（上图中的第1、2步），使得攻击者可以以中间人的方式劫持这次请求，从而进行后续的攻击，例如窃听数据，篡改请求和响应，跳转到钓鱼网站等。

以劫持请求并跳转到钓鱼网站为例，其大致做法如下图所示：
![alt](https://imgcdn.a632079.me/uploads/2018/05/1968_14a5083632ed267a.png)

* 第1步：浏览器发起一次明文HTTP请求，但实际上会被攻击者拦截下来
* 第2步：攻击者作为代理，把当前请求转发给钓鱼网站
* 第3步：钓鱼网站返回假冒的网页内容
* 第4步：攻击者把假冒的网页内容返回给浏览器

这个攻击的精妙之处在于，攻击者直接劫持了HTTP请求，并返回了内容给浏览器，根本不给浏览器同真实网站建立HTTPS连接的机会，因此浏览器会误以为真实网站通过HTTP对外提供服务，自然也就不会向用户报告当前的连接不安全。于是乎攻击者几乎可以神不知鬼不觉的对请求和响应动手脚。

### 解决: 使用 HSTS
HSTS 的全称是 HTTP Strict-Transport-Security，它是一个 Web 安全策略机制（web security policy mechanism）。

HSTS 最早于 2015 年被纳入到 ThoughtWorks 技术雷达，并且在 2016 年的最新一期技术雷达里，它直接从“评估（Trial）”阶段进入到了“采用（Adopt）“阶段，这意味着ThoughtWorks 强烈主张业界积极采用这项安全防御措施，并且 ThoughtWorks 已经将其应用于自己的项目。

HSTS 最为核心的是一个 HTTP 响应头（HTTP Response Header）。正是它可以让浏览器得知，在接下来的一段时间内，当前域名只能通过 HTTPS 进行访问，并且在浏览器发现当前连接不安全的情况下，强制拒绝用户的后续访问要求。

HSTS Header的语法如下：
```
Strict-Transport-Security: <max-age=>[; includeSubDomains][; preload]
```
其中：
* `max-age`是必选参数，是一个以秒为单位的数值，它代表着HSTS Header的过期时间，通常设置为1年，即31536000秒。
* `includeSubDomains`是可选参数，如果包含它，则意味着当前域名及其子域名均开启HSTS保护。
* `preload`是可选参数，只有当你申请将自己的域名加入到浏览器内置列表的时候才需要使用到它。关于浏览器内置列表，下文有详细介绍。

> 注: 添加 HSTS 响应头之后， 在生效时间内，站点无法提供安全的 HTTPS 服务时， 浏览器将不再允许“忽略安全错误”

### 目的: 使浏览器直接跳转
只要在服务器返回给浏览器的响应头中，增加 Strict-Transport-Security 这个 HTTP Header（下文简称HSTS Header），例如：
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```
就可以告诉浏览器，在接下来的 31536000 秒内（1年），对于当前域名及其子域名的后续通信应该强制性的只使用HTTPS，直到超过有效期为止。

### HSTS Preload List 是啥咧？
![alt](https://imgcdn.a632079.me/uploads/2018/05/TIM截图20180526223148.png)
将支持 HSTS 的网站全部加入一个 Preload 的清单，支持 HSTS 协议的浏览器请求网站前会查询当前网站是否在清单中，如果是那么直接转换为 HTTPS 请求！从而解决前半程为 HTTP 的问题，如果我们的网站启用了 HSTS，还得将网站提交到这个 Preload 清单才行了。

提交地址：https://hstspreload.org/  (请自备小飞机)

提交直到批准，我们的网站必须强制 301 跳转到 HTTPS，否则无法通过，完成审核后再取消 301 即可。

提交前注意几点：
* 需在全站启用 HTTPS（包括子域名），同时重定向所有 HTTP 流量至 HTTPS
* `max-age`必须至少 31536000 秒（1年）
* `includeSubdomains` 和 `preload`
* 不能反悔的哦，撤销比较麻烦，不过也有人成功撤销了

如果主域名旗下有其它子域名没有完成 HTTPS 一定不要做，否则提交后默认主域名下的任何链接都会使用HTTPS协议访问。

> 参考: [HSTS详解](https://www.jianshu.com/p/caa80c7ad45c)
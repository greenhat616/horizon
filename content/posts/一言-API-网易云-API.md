---
title: 一言 API & 网易云 API
tags: [ "api", "hitokoto", "netease"]
slug: teng-koa
lastmod: '2018-05-26T21:15:47+08:00'
date: 2018-02-22T16:11:47+08:00
categories: 个人作品
featured_image: https://piccdn.freejishu.com/images/2016/07/18/59fe422cee6a2b825e4521ace38cc8b0.jpg
---

> 当前 API 版本: `v1.4.3`

### 何为 一言？
  
>  动漫也好、小说也好、网络也好，不论在哪里，我们总会看到有那么一两个句子能穿透你的心。我们把这些句子汇聚起来，形成一言网络，以传递更多的感动。如果可以，我们希望我们没有停止服务的那一天。  
> 简单来说，一言指的就是一句话，可以是动漫中的台词，也可以是网络上的各种小段子。  

<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width="330" height="86" src="https://cdn.a632079.me/163music.html?playlist=492926375" style="margin:0"></iframe>

### 何为 网易云？
Emmmm, 我想这个没啥好说的。

### 使用
> 项目实际是个 Live Demo，~~所以仅保证可用，不保证速度。~~ 目前本接口也是 `v1.hitokoto.cn` 的子接口， 稳定性保障哦~
> 项目基于 Teng-koa (https://github.com/a632079/teng-koa) 还望使用之余给个 Star~

#### 状态统计
访问： https://api.a632079.me/status  
#### 一言
> 一言数据基于 `Hitokoto.cn`, 已经过授权。由于 API 本身是基于 v1 的再设计，所以预计在下月初就能将原有框架更新完毕。 

接口： `https://api.a632079.me`   
支持的参数: `http://hitokoto.cn/api`    
与目前的接口不同，我们目前还支持提供 `JSONP` 和 `JS` 返回。  
以下是一个调用例子：  
https://api.a632079.me?callback=poi&encode=text
https://api.a632079.me?encode=js&select=%23hitokoto  (`select` 为可选，默认为 `.hitokoto`. 记得要 URL 编码哦 `#` -> `%23`)

#### 网易云
接口: `https://api.a632079.me/nm/`  

> 目前该接口已开启缓存服务 （开启检测的概要查询缓存 7 天， 其余数据缓存 2 小时）
> 目前 API 正在逐步更新， 由 Linux API -> Web API 以增加 `offset` 和 `limit` 参数

支持以下 ~~8~~ 16 个功能：  
* 搜索曲目 - `https://api.a632079.me/nm/search/:keyword`
  * 参数：
    * 种类 - `type`:
      * 专辑: `ALBUM`
      * 歌手: `ARTIST`
      * 电台: `DJ`
      * 歌词: `LYRIC`
      * 视频: `MV`
      * 歌单: `PLAYLIST`
      * 歌曲: `SONG` (默认)
      * 用户: `USER`
    * 偏移量 - `offset`
    * 限制量 - `limit`
      * 一次返回多少结果
  * 调用示例: `https://api.a632079.me/nm/search/海阔天空?type=SONG&offset=0&limit=30`
* 获得歌单 - `https://api.a632079.me/nm/playlist/:id`  
* 获得曲图 - `https://api.a632079.me/nm/picture/:id/:height?`  
* 获得歌手 - `https://api.a632079.me/nm/artist/:id`  
* 获得专辑 - `https://api.a632079.me/nm/album/:id`  
* 获得歌词 - `https://api.a632079.me/nm/lyric/:id`  
* 获得歌曲 - `https://api.a632079.me/nm/url/:id`   
* 获得细节 - `https://api.a632079.me/nm/detail/:id`  
* 获得概要 - `https://api.a632079.me/nm/summary/:id`
  * 启用歌词 - `https://api.a632079.me/nm/summary/:id?lyric=true`
  * 关闭检测 - `https://api.a632079.me/nm/summary/:id?quick=true`
    * 默认开启检测， 目的是筛除无法播放的歌曲（未返回 URL）
  * 优化结果 - `https://api.a632079.me/nm/summary/:id?common=true`
  * 调用示例 -  `https://api.a632079.me/nm/summary/28391863,22640061?common=true&lyric=true&quick=true`
* 重定向
  * 歌曲 - `https://api.a632079.me/nm/redirect/music/:id`
  * ~~图片 - `https://api.a632079.me/nm/redirect/picture/:id`~~ 因为图片地址不改变，所以移除该 API
* 播放记录 - `https://api.a632079.me/nm/record/:uid`
  * 获取周记录 - `https://api.a632079.me/nm/record/:uid?weekly=true`
* 歌曲评论 - `https://api.a632079.me/nm/comment/music/:id`
  * 可选参数 -  `offset` `limit`
  * 调用示例 - `https://api.a632079.me/nm/comment/music/28391863?offset=0&limit=100`
* 视频链接 - `https://api.a632079.me/nm/url/mv/:mvid`
  * 受上级 SDK 影响， 暂时 302 至另一个接口
* 用户电台 - `https://api.a632079.me/nm/user/dj/:uid`
  * 参数 - `offset` `limit`
  * 调用示例 - `https://api.a632079.me/nm/user/dj/91239965?limit=30&offset=0`
* 电台节目 - `https://api.a632079.me/nm/dj/:rid`
  * 参数 - `offset` `limit`
  * 调用示例 - `https://api.a632079.me/nm/dj/336355127?limit=30&offset=1`
* 电台细节 - `https://api.a632079.me/nm/dj/detail/:rid`

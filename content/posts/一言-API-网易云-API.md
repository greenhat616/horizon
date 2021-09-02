---
title: 一言 API & 网易云 API
tags: [ "api", "hitokoto", "netease"]
slug: teng-koa
lastmod: 2021-09-02T07:33:46.568Z
date: 2018-02-22T16:11:47+08:00
categories: 个人作品
featured_image: https://piccdn.freejishu.com/images/2016/07/18/59fe422cee6a2b825e4521ace38cc8b0.jpg
description: 动漫也好、小说也好、网络也好，不论在哪里，我们总会看到有那么一两个句子能穿透你的心。我们把这些句子汇聚起来，形成一言网络，以传递更多的感动。
---

> 当前 API 版本: `v1.7.0`

### 何为 一言？
  
>  动漫也好、小说也好、网络也好，不论在哪里，我们总会看到有那么一两个句子能穿透你的心。我们把这些句子汇聚起来，形成一言网络，以传递更多的感动。如果可以，我们希望我们没有停止服务的那一天。  
> 简单来说，一言指的就是一句话，可以是动漫中的台词，也可以是网络上的各种小段子。  

{{<row>}}
<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width="330" height="86" src="https://cdn.a632079.me/163music.html?playlist=492926375" style="margin:0"></iframe>
{{</row>}}

### 何为 网易云？
Emmmm, 我想这个没啥好说的。

### 使用
> 项目实际是个 Live Demo，所以仅~~保证可用~~，不保证速度。  
> 目前本接口也是 `v1.hitokoto.cn` 的子接口， 稳定性保障哦~  
> ~~项目基于 Teng-koa (https://github.com/a632079/teng-koa) 还望使用之余给个 Star~~
> **2021.09.02 注：** 项目已迁移至 [hitokoto-api](https://github.com/hitokoto-osc/hitokoto-api), 大家可以在这个仓库反馈接口问题。

#### 状态统计
访问： https://api.a632079.me/status  
#### 一言

接口： `https://api.a632079.me`

> 您可以使用：`https://v1.hitokoto.cn/` 替代   

支持的参数: `http://hitokoto.cn/api`    
与目前的接口不同，我们目前还支持提供 `JSONP` 和 `JS` 返回。  
以下是一个调用例子：  
https://api.a632079.me?callback=poi&encode=text  
https://api.a632079.me?encode=js&select=%23hitokoto  
* `select` 为可选，默认为 `.hitokoto`. 记得要 URL 编码哦 `#` -> `%23`

#### 网易云
接口: `https://api.a632079.me/nm/`  

> 目前该接口已开启缓存服务 （开启检测的概要查询缓存 7 天， 其余数据缓存 2 小时）
> **2021.09.02 注：** 网易云底层模块已切换到 [Binaryify/NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi) 。

支持以下 ~~8~~ 16 个功能：  
* 搜索曲目 - `https://api.a632079.me/nm/search/:keyword`
  * 参数：
    * 关键字 - `keyword`
    * 种类 - `type`:
      * 专辑: `ALBUM`
      * 歌手: `ARTIST`
      * 电台: `DJ`
      * 歌词: `LYRIC`
      * 音视: `MV`
      * 歌单: `PLAYLIST`
      * 歌曲: `SONG` (默认)
      * 用户: `USER`
      * 视频: `VIDEO`
      * 综合: `COMPLEX`
    * 偏移量 - `offset`
    * 限制量 - `limit`
      * 一次返回多少结果
    * 刷新缓存 - `nocache` （请不要滥用此选项，否则此功能可能在未来版本中移除）  
  * 调用示例: `https://api.a632079.me/nm/search/海阔天空?type=SONG&offset=0&limit=30`
* 获取歌单 - `https://api.a632079.me/nm/playlist/:id`
  * 参数：
    * 最近的 x 个收藏者 - `s` （默认为: 8)
    * 歌单标识 - `id`
    * 刷新缓存 - `nocache`
* 获取曲图 - `https://api.a632079.me/nm/picture/:id/:height?`  
* 获取歌手 - `https://api.a632079.me/nm/artist/:id`
  * 参数：
    * 歌手标识 - `id`
    * 刷新缓存 - `nocache`  
* 获取专辑 - `https://api.a632079.me/nm/album/:id`
  * 参数：
    * 专辑标识 - `id`
    * 刷新缓存 - `nocache` 
* 获取歌词 - `https://api.a632079.me/nm/lyric/:id`
  * 参数：
    * 歌曲标识 - `id`
    * 刷新缓存 - `nocache`   
* 获取歌曲地址 - `https://api.a632079.me/nm/url/:id`
  * 参数：
    * 歌曲标识（使用 `,` 分割） - `id`
  * 该接口不启用缓存   
* 获取歌曲细节 - `https://api.a632079.me/nm/detail/:id`  
  * 该接口同时支持使用 ids 参数传入 id 数组使用
  * 参数：
    * 歌曲标识（用 `,` 分割） - `id` 
    * 刷新缓存 - `nocache`
* 获取概要 - `https://api.a632079.me/nm/summary/:id`
  * 启用歌词 - `https://api.a632079.me/nm/summary/:id?lyric=true`
  * 关闭检测 - `https://api.a632079.me/nm/summary/:id?quick=true`
    * 默认开启检测， 目的是筛除无法播放的歌曲（未返回 URL）
  * 优化结果 - `https://api.a632079.me/nm/summary/:id?common=true`
  * 调用示例 -  `https://api.a632079.me/nm/summary/28391863,22640061?common=true&lyric=true&quick=true`
  * 该接口也支持使用 `nocache` 刷新缓存
* 重定向
  * 歌曲 - `https://api.a632079.me/nm/redirect/music/:id`
* 歌曲评论 - `https://api.a632079.me/nm/comment/music/:id`
  * 参数：  
    * 偏移量 - `offset`
    * 限制量 - `limit`
    * 分页参数 - `before` 参考：[歌曲评论](https://neteasecloudmusicapi.vercel.app/#/?id=%e6%ad%8c%e6%9b%b2%e8%af%84%e8%ae%ba)
    * 刷新缓存 - `nocache`
  * 调用示例 - `https://api.a632079.me/nm/comment/music/28391863?offset=0&limit=100`
* 获取 MV 信息 - `https://api.a632079.me/nm/mv/:mvid`
  * 参数：
    * MV 标识 - `mvid`
    * 刷新缓存 - `nocache`
* 获取 MV 地址 - `https://api.a632079.me/nm/mv/url/:mvid`
  * 参数：
    * MV 标识 - `mvid`
    * 分辨率 - `r`
    * 刷新缓存 - `nocache`
* 获取电台节目 - `https://api.a632079.me/nm/dj/:rid`
  * 参数：
    * 电台标识 - `rid`
    * 偏移量 - `offset`
    * 限制量 - `limit`
    * 排序方式 - `asc`
    * 刷新缓存 - `nocache`
  * 调用示例 - `https://api.a632079.me/nm/dj/336355127?limit=30&offset=1`
* 获取电台节目详情 - `https://api.a632079.me/nm/dj/program/detail/:id`
  * 参数：
    * 电台节目标识 - `id`
    * 刷新缓存 - `nocache`
* 获取电台介绍 - `https://api.a632079.me/nm/dj/detail/:rid`
  * 参数：
    * 电台标识 - `rid`
    * 刷新缓存 - `nocache`
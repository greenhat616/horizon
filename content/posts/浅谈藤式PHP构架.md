---
title: 浅谈藤式PHP构架
tags: ["浅谈", "技术", "2017","教程", "动态", "学习"]
slug: teng-php
lastmod: '2017-08-23T11:29:02+08:00'
date: 2017-01-24T23:02:48+08:00
featured_image: https://piccdn.freejishu.com/images/2016/10/03/a76f44e1a7b904cae790d93eab3529ca.jpg
draft: true
---

写一个PHP程序，最重要的是**入口简洁，唯一**。**构架清晰，模块化，易维护**。  
为什么要分享我的设计思路呢？  
* 一个原因是：我看到很多和我一样的PHP新手都喜欢建立不同的文件(例如`index.php,upload.php,avatar.php,push.php`)  
* 另一个原因是：我自己也是新手，渴望获得大佬们的指教**~~（说白就是求大佬怒喷）~~**   
废话不多说，我要开始自卖自夸我的设计了。
<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width="330" height="106" src="https://cdn.a632079.me/163cplayer.html?playlist=28524464"></iframe>  

### 目录
```
./
|--index.php 入口文件
|--protect 保护文件夹
|     |--core 核心文件夹
|     |--themes 模板
|     |-- 扩展 或者是 其他
|--resource 资源（CSS，JAVASCRPT，IMAGE）
```
在我的设计中，*入口必须是唯一的，而且程序核心工作绝对不是在入口文件中开始的*。  
目录 <font color ="red">**protect**</font> 是我用来放置配置，系统功能的目录。通常我都是使用Nginx来对这个目录限制访问权限（`return 403`）。  
目录 <font color ="blue">**resource**</font> 是我用来放置可访问资源的。例如：页面需要使用到的`font`,`css`,`JavaScript`等等。  
总体上来看，我这样设计的目的就是区分功能，入口唯一，便于维护。

###  代码
```PHP
<?php
//Set Path
define('path','./protect/aila/');
//Load Config
require_once(path.'config.php');
//Load Main Class
require_once(path.'main.class.php');
//init
$core = new core();
if($core -> init() !== 0 ){
    exit($core -> init());
}
//Main
//handle GET & POST data
$a = (isset($_GET))? $_GET : false;
$b = (isset($_POST))? $_POST : false;
$core -> handle($a,$b);
//END
$end = array(
    "stats" => "Error",
    "where" => "Unknown",
    "data" => "Can't Catch."
    );
die(json_encode($end));
```

这是我书写一个API入口时所用的代码，因为api服务必须具有多种不同的功能，所以目录上就没有采用一般目录设计了，在这里就直接使用api的代称直接建档了。   
<font color="green">在这个入口里，我的代码主要是为了初始化核心类。然后，我直接将GET和POST这两种方式所能获得的信息，直接提交给了核心类的处理函数。处理函数便会帮助我分发给所需要的处理函数</font>

><font color="orange">下面是我帮别人写的初始化代码，仅供参考</font>

##### config.php
```PHP
<?php
define("app_name","");
define("app_key","");
define("app_url","");
define("app_entrance","");
define("app_multi",false);
$config = (object)array(
        "db" => (object)array(
                "host" => "",
                "username" => "",
                "password" => "",
                "dbname" => "",
                "port" => ""
            ),
        "debug" => "On", 
        "multi" => false,//多服务器协作
        //"multi_server" => array(); 看情况以后加入吧
        "" => "",
        // More Config
    );
 
```
##### main.class.php

```PHP
<?php
    class core{
        protected $db = false;
        protected $config = null;
        //Use $this-> $db instead of $db
        
        function __construct(){ //初始化变量
        
        }
        
        public function init(){
          
        }
        
        private function debug(){
           
            }
        }
        
        public function handle($get,$post){
                       
        }      
    }
 
    class DB extends mysqli{

    }
```  
> #### **<font color="purple">代码真心直供参考...毕竟我只是新手啊！</font>**

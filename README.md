<!--
 * @Author: kiliaosi
 * @Date: 2020-08-18 10:29:36
 * @LastEditors: kiliaosi
 * @LastEditTime: 2020-08-18 11:44:38
 * @Description: 
-->
# Javascript 代码加密混淆工具

## 工具简介
支持对js源代码进行混淆，混淆对象主要为：流程控制语句、字符串、对象属性名。可根据参数设置混淆比例。对你的源代码提供保护。

## 功能特点
- 字符串加密
- 对象属性名混淆
- 反调试
- 去除日志
- 控制流语句展开

## 使用方式
```bash
npm install

node main.js source.js
```

## example
```bash
node main.js ./test
```
> 命令行支持传入单个文件或目录，加密完成后会在当前目录下生成以 .sec.js结尾的文件。

## 加密参数

```js
"--anti-debug": {default:1,
    check:function(num){
    return [[1,0].indexOf(num)!==-1,'值必须为1或0'];
  }},//反调试
	"--string-encrypt-ratio":{
    default:1,
    check:function(num){
      return [num>=0 && num<=1,'value>=0 && value<=1'];
    }
  },//字符串加密比率
	"--member-encrypt-type":{
    default:1,
    check:function(num){
      return [[1,0].indexOf(num)!==-1,'值必须为1或0'];
    }
  },//属性加密方式
	"--member-encrypt-ratio":{
    default:0.8,
    check:function(num){
      return [num>=0 && num<=1,'value>=0 && value<=1'];
    }
  },//属性加密比率
	"--code-obf":{
    default:0,
    check:function(num){
      return [num>=0 && num<=1,'value>=0 && value<=1'];
    }
  },//代码混淆比率
	"--reserve-global-name":{
    default:1,
    check:function(num){
      return [[1,0].indexOf(num)!==-1,'值必须为1或0'];
    }
  },//保留全局变量
  "--anti-log":{
    default:1,
    check:function(num){
      return [[1,0].indexOf(num)!==-1,'值必须为1或0'];
    }
  },
  "--compatible": {
    default:0,
    check:function(num){
      return [[1,0].indexOf(num)!==-1,'值必须为1或0'];
    }
```

## node版本限制
```bash
10.x || 11.x || 12.x || 13.x || 14.x
```
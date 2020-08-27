const esprima = require("esprima");
const escodegen = require("escodegen");
const fs = require("fs");
const path = require("path");
const EA = require("estraverse");
const JO = path.join;
const BB = require("babel-core");
const jsobf = require("javascript-obfuscator");
const err_list = [];
const uglify = require("uglify-js");
// const success_list = []
const func_list = []
var func_argv = [];
var func_name = [];
var dirlist = [];
var globalVal = [];

// 一些flag设置
let ES5 = 1
var flag = 0
let DEBUG = 0
let BACKUP = 1
let ANTI_DEBUG = 0//反调试
let STRING_ENCRYPT_RATIO = 1;//字符串加密比率
let MEMBER_ENCRYPT_RATIO = .8;//成员变量加密比例
let MEMBER_ENCRYPT_TYPE = 1;//属性加密方式0多一层call，1仅转码，性能好点
let RESERVE_GLOBAL_NAME = 1;//保留全局名称
let ONLY_OBF = 0;
const TS = 'MTU5ODQ4NjQwMDAwMA==';
const sign = 'aeaa05347340639a2523659f8edc8c6009035718bf589eaa3396e4215dd0ed09';

//部分参数,上面的参数部分转移到此处列表
const flagList = {
  ANTI_DEBUG:1,
  STRING_ENCRYPT_RATIO:1,
  MEMBER_ENCRYPT_RATIO:0.5,
  MEMBER_ENCRYPT_TYPE:0,
  RESERVE_GLOBAL_NAME:1,
  CODE_OBF:0.1,
  ANTI_LOG:1,
  COMPATIBLE:0//兼容模式，禁用js-obf
}

var commandList = {
  "--anti-debug":{default:1,
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
  "--compatible":{
    default:0,
    check:function(num){
      return [[1,0].indexOf(num)!==-1,'值必须为1或0'];
    }
  }
};
//生成器函数
function parseCommand(argv){
  //链式调用步骤虽然有点多，看起来有点多余，但是将每个操作隔开，逻辑会更清晰
  //尽量使用es5语法，避免加密或es6->es5过程中出现的不明错误
  
  //第一步格式化参数列表
	const effectCommand = argv.map(function(item){
		return item.split('=');
	}).filter(function(item){
    //第二步，筛选合法参数
		return commandList.hasOwnProperty(item[0])
	}).map(function(item){
    //第三步，检验参数值合法性
    let arr = item.concat([]);
    arr[1] = Number(arr[1]);
    let memberName = arr[0],memberNum = arr[1];
    const flag = commandList[memberName] && commandList[memberName].check(memberNum);
    if(!flag[0]){
      process.stderr.write(`参数：${memberName} 值不合法，参数值必须满足条件：${flag[1]}`);
      process.exit(9);
    }
    return arr;
  }).map(function(item){
    //第四步，设置参数
    console.log(item)
    let commandName = item[0],commandValue = item[1];
    commandName = commandName.toUpperCase();
    commandName = commandName.replace("--",'');
    commandName = commandName.replace(/\-/img,"_");
    flagList[commandName] = commandValue;
    console.log(commandName,flagList[commandName])
    return item
  })
  Object.freeze(flagList);
  console.log(flagList);
  return effectCommand;
}

// console.log(effectCommand);
parseCommand(process.argv.slice(3));
function check(){
  const chmac = require('crypto').createHmac;
  const secret= decodeBase64(decode_func_list.six);
  const ts = decodeBase64(TS);
  const hmac = chmac('sha256',secret);
  const sha = hmac.update(ts).digest('hex');
  return sha === sign;
}



// 保存字符串的数组和计数器，加密下一个文件前会重置
var arr_Literal0 = []
var arr_Literal1 = []
var arr_Literal2 = []
var arr_Literal3 = []
var counter1 = 0;
var counter2 = 0;
var counter3 = 0;
var counter4 = 0;

//过滤特定文件，TODO：可以通过参数控制
const ignore_file = []

// 过滤开源js文件
const open_source_obj = {
  "vue": ['vue.common.dev.js', 'vue.common.js', 'vue.common.prod.js', 'vue.esm.browser.js', 'vue.esm.browser.min.js', 'vue.esm.js', 'vue.js', 'vue.min.js', 'vue.runtime.common.dev.js', 'vue.runtime.common.js', 'vue.runtime.common.prod.js', 'vue.runtime.esm.js', 'vue.runtime.js', 'vue.runtime.min.js'],
  "bootstrap": ['bootstrap.bundle.js', 'bootstrap.bundle.min.js', 'bootstrap.js', 'bootstrap.min.js'],
  "react": ['react.development.js', 'react.production.min.js', 'react.development.js', 'react.production.min.js', 'react.profiling.min.js'],
  "d3": ['d3.js', 'd3.min.js'],
  "axios": ['axios.min.js', 'axios.js'],
  "font-awesome": ['all.js', 'all.min.js', 'brands.js', 'brands.min.js', 'fontawesome.js', 'fontawesome.min.js', 'regular.js', 'regular.min.js', 'solid.js', 'solid.min.js', 'v4-shims.js', 'v4-shims.min.js'],
  "angular": ['angular2-all-testing.umd.dev.js', 'angular2-all.umd.dev.js', 'angular2-all.umd.js', 'angular2-all.umd.min.js', 'angular2-polyfills.js', 'angular2-polyfills.min.js', 'angular2.dev.js', 'angular2.js', 'angular2.min.js', 'http.dev.js', 'http.js', 'http.min.js', 'router.dev.js', 'router.js', 'router.min.js', 'Rx.js', 'Rx.min.js', 'Rx.umd.js', 'Rx.umd.min.js', 'testing.dev.js', 'upgrade.dev.js', 'upgrade.js', 'upgrade.min.js', 'ui.dev.js', 'worker.dev.js'],
  "angular-touch": ['angular-touch.min.js', 'angular-touch.js'],
  "angular-sanitize": ['angular-sanitize.min.js', 'angular-sanitize.js'],
  "angular-resource": ['angular-resource.min.js', 'angular-resource.js'],
  "angular-messages": ['angular-messages.min.js', 'angular-messages.js'],
  "three": ['three.module.js', 'three.min.js', 'three.js'],
  "jquery": ['core.js', 'jquery.js', 'jquery.min.js', 'jquery.slim.js', 'jquery.slim.min.js'],
  "typescript": ['typescript.min.js', 'typescript.js'],
  "redux": ['redux.min.js', 'redux.js'],
  "antd": ['antd-with-locales.js', 'antd-with-locales.min.js', 'antd.js', 'antd.min.js'],
  "reveal": ['reveal.js', 'reveal.min.js', 'html5shiv.js', 'promise.js', 'highlight.js', 'highlight.min.js', 'markdown.js', 'markdown.min.js', 'marked.js', 'math.js', 'math.min.js', 'client.js', 'client.min.js', 'index.js', 'index.min.js', 'master.js', 'master.min.js', 'client.js', 'client.min.js', 'index.js', 'index.min.js', 'notes.js', 'notes.min.js', 'print-pdf.js', 'print-pdf.min.js', 'search.js', 'search.min.js', 'zoom.js', 'zoom.min.js'],
  "react-dom": ['react-dom.js', 'react-dom.production.min.js', 'react-dom.production.js'],//关键字匹配
  "angular": ['angular.js', 'angular2.js', 'angular2.min.js'],//关键字匹配
  "socket": ['socket.io.js', 'socket.io.slim.js'], //关键字匹配
  "TweenMax":["TweenMax.min.js","TweenMax.js"]
}


const decode_func_list={
  one:"KyBmdW5jdGlvbiAoYSwgYiwgYywgZCwgZSwgZikgewogICAgY29uc29sZS5sb2coJzEnKQp9KFsiMSJdLCBbIjEiXSwgWyIxIl0sIFsiMSJdLCBbIjEiXSwgWyIxIl0p",
__two:"ISBmdW5jdGlvbiAoYSkgewogICAgY29uc29sZS5sb2coJzEnKQp9KHsKICAgIDA6IGNvbnNvbGUubG9nID0gKGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZ1bmN0aW9uICgpIHsgfSB9KShjb25zb2xlLmxvZyksCiAgICAxOiAoZnVuY3Rpb24gKCkgewogICAgICAgIHZhciB0aW1lc3RhbXAgPSAobmV3IERhdGUoKSkudmFsdWVPZigpOwogICAgICAgIGRlYnVnZ2VyCiAgICAgICAgdmFyIHRpbWVzdGFtcDIgPSAobmV3IERhdGUoKSkudmFsdWVPZigpOwogICAgICAgIGlmICgodGltZXN0YW1wMiAtIHRpbWVzdGFtcCkgPiAxMDAwKSB0aHJvdyBTeW50YXhFcnJvcigpOwogICAgfSkoKQp9KQ==",
  two:"LSBmdW5jdGlvbiAoYSkgewogICAgY29uc29sZS5sb2coJzEnKQp9KHt9KQ==",
three:"CiAgZnVuY3Rpb24gc3RyX3JldmVyc2UobnVtKSB7CgkJcmV0dXJuIE9PT1tudW1dOwp9Cg==",
 four:"CgogIGZ1bmN0aW9uIE9PTyhudW0pIHsKCXZhciBhID0gb29vW251bV0sIHMgPSAiIjsKCWlmIChhLm1hdGNoKCJfMHgiKSAhPSBudWxsICYmIGEubWF0Y2goIl8weCIpLmluZGV4ID09IDApIHsKCQkoZnVuY3Rpb24gKCkgewoJCQkKCQl9KSgpOwoJCWZvciAodmFyIF8weEkgPSAzOyBfMHhJIDwgYS5sZW5ndGg7IF8weEkrKykgcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCgoYVtfMHhJXS5jaGFyQ29kZUF0KCkgXiAweDEwMjQpKSk7IHJldHVybiBzOy8vLnNwbGl0KCcnKS5yZXZlcnNlKCkuam9pbignJyk7Cgl9CgllbHNlIHJldHVybiBhOwp9Cg==",
 five:"dmFyIG9vb29vb29vID0gKGZ1bmN0aW9uICgpIHsgcmV0dXJuIDcgPj4gMSB9KSgpIC0gKGZ1bmN0aW9uICgpIHsgcmV0dXJuIDEgPDwgMSB9KSgp",
 six:"a2l3aXNlY2VuY3J5cHRfamF2YXNjcmlwdDIwMTk=",
 seven:"KGZ1bmN0aW9uKCl7Cgl3aW5kb3cuY29uc29sZVByb2V0Y3QgPSBjb25zb2xlOwoJd2luZG93LmNvbnNvbGUgPSB7CgkJbG9nOmZ1bmN0aW9uKCl7fSwKCQl3YXJuOmZ1bmN0aW9uKCl7fSwKCQlkZWJ1ZzpmdW5jdGlvbigpe30sCgkJZXJyb3I6ZnVuY3Rpb24oKXt9LAoJfTsKfSkoKQ=="
}



function decodeBase64(base64Str){
  return Buffer.from(base64Str,'base64').toString('ascii');
}

const checkjih = check();
if(!checkjih ){
  process.exit(1);
}

if(Number(decodeBase64(TS))<Date.now()){
  process.exit(7);
}



function printAST(ast) {
  console.log(JSON.stringify(ast));
  fs.writeFileSync('./test/demo.json', JSON.stringify(ast))
}

/**
 * 过滤开源项目的JS文件，避免过多的体积和性能损失
 * @param {String} filename 待加密的文件路径
 */
function ignore(filename) {
  if (filename.slice(-3) != ".js") return 1;
  if (filename.indexOf("node_modules") != -1) return 1;

  // 忽略指定文件
  let jsfilename = path.basename(filename);
  if (ignore_file.indexOf(jsfilename) > -1) {
    console.log('NOTE: ignore file ' + filename);
    return 1;
  }

  // 忽略开源项目的js文件
  for (let i in open_source_obj) {
    if (filename.indexOf(i) > -1) {
      let open_file = open_source_obj[i]
      if (open_file.indexOf(jsfilename) > -1) {
        console.log('NOTE: ignore open-source file ' + filename);
        return 1;
      }
    }
  }
  return 0;
}

/**
 * 根据固定的字符串随机生成字符串
 * @param {Int} len 生成字符串长度
 */
function randomString_O(len) {
  let $chars = "0oO";
  let maxPos = $chars.length;
  let pwd = "";
  for (i = 0; i < len; i++) {
    pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
  }
  console.log(pwd)
  return pwd;
}

/**
 * 对字符串中的字符依次异或、16进转化处理
 * @param {String} in_str 待加密的字符串
 */
function code_enc_str(in_str) {

  if (in_str == '') return '';
  let out_str = "";
  let tmp = [];
  for (let i = 0; i < in_str.length; i++) {
    tmp[i] = in_str[i].charCodeAt() ^ 0x1024;
    tmp[i] = tmp[i].toString(16);
    while (tmp[i].length < 4)
      tmp[i] = '0' + tmp[i];
    out_str += '__QY__' + tmp[i];
  }
  return '_0x' + out_str;
}

/**
 * 将字符串中的字符依次进行预unicode码转换，TODO：可以和code_enc_str合并为一个函数
 * @param {String} in_str 待加密的字符串
 */
function code_change_str(in_str) {

  if (in_str == '') return ''
  let out_str = "";
  let tmp = [];
  for (let i = 0; i < in_str.length; i++) {
    tmp[i] = in_str[i].charCodeAt();
    tmp[i] = tmp[i].toString(16);
    while (tmp[i].length < 4)
      tmp[i] = '0' + tmp[i];
    out_str += '__QY__' + tmp[i]
  }
  return out_str;
}

/**
 * 对字符串进行反序例化处理[准备废弃：性能损失严重]
 * @param {String} in_str 待转化的字符串
 */
function str_reverse(in_str) {
  return in_str;
  // return in_str.split('').reverse().join('');
}

/**
 * 随机生成6个参数名称
 */
function genFuncArgv() {
  let func_argv = [];
  for (let j = 0; j < 6; j++) {
    let tmp = 'o' + randomString_O(4)
    while (1) {
      if (func_argv.indexOf(tmp) > -1) {
        tmp = 'o' + randomString_O(4)
      } else {
        func_argv.push(tmp)
        break
      }
    }
  }

  return func_argv;
}

/**
 * 随机生成6个函数名称
 */
function genFuncName() {
  const func_name = []
  for (let j = 0; j < 6; j++) {
    let tmp = 'o' + randomString_O(6)
    while (1) {
      if (func_name.indexOf(tmp) > -1) {
        tmp = 'o' + randomString_O(6)
      } else {
        func_name.push(tmp)
        break
      }
    }
  }

  return func_name;
}

/**
 * 遍历语法树各种节点，并进行相关加密
 * @param {Object} ast 待加密文件的语法树
 */
function handle_rec0(ast) {
  EA.replace(ast, {

    leave: function (node, parentnode) {

      // 对象的key
      if (parentnode.key && parentnode.key.value == node.value) {
        return node;
      }

      // 二进制表达式的left
      // if (parentnode.left && parentnode.left.value == node.value) {
      //   return node;
      // }

      // 常规字面量
      if (node.type == 'Literal' && typeof (node.value) == 'string') {

        // if(parentnode && parentnode.type == 'ArrayExpression'){
        //   return node;
        // }
        if (1 < node.value.length && node.value.length <= 3 && Math.random() <= flagList.STRING_ENCRYPT_RATIO) {
          let call_ast = esprima.parseScript(func_name[0] + '(' + counter1 + ')');

          // 匹配字符串中的中文和特殊字符
          if (/.*[\u4e00-\u9fa5]+.*$/.test(node.value) || node.value.indexOf('\n') > -1
            || node.value.indexOf('\"') > -1 || node.value.indexOf('\\') > -1)
            arr_Literal0.push(code_change_str(str_reverse(node.value)))
          else arr_Literal0.push(str_reverse(node.value))
          counter1++;
          return call_ast.body[0].expression
        }
        else if (3 < node.value.length && node.value.length <= 20 && Math.random() <= flagList.STRING_ENCRYPT_RATIO) {

          
          //字符串分割
          let bin_str = esprima.parseScript('\'1\'+ \'2\'+ \'3\'')
          let tmp = node.value
          let tmp_m = tmp.substring(1, tmp.length - 1)
          if (/.*[\u4e00-\u9fa5]+.*$/.test(tmp_m) || tmp_m.indexOf('\n') > -1
            || tmp_m.indexOf('\"') > -1 || tmp_m.indexOf('\\') > -1) {
              // console.log(node.value);
            arr_Literal1.push(code_enc_str(str_reverse(tmp_m)))
          } else {
            arr_Literal1.push(str_reverse(tmp_m))
          }

          let call_ast = esprima.parseScript(func_name[1] + '(' + counter2 + ')');

          bin_str.body[0].expression.left.left.value = tmp[0]
          bin_str.body[0].expression.left.left.raw = '\"' + tmp[0] + '\"'

          bin_str.body[0].expression.left.right = call_ast.body[0].expression

          bin_str.body[0].expression.right.value = tmp[tmp.length - 1]
          bin_str.body[0].expression.right.raw = '\"' + tmp[tmp.length - 1] + '\"'

          counter2++;
          return bin_str.body[0].expression

        } else if (node.value.length > 20  && Math.random() <=flagList.STRING_ENCRYPT_RATIO) {
          let call_ast = esprima.parseScript(func_name[2] + '(' + counter3 + ')');
          if (/.*[\u4e00-\u9fa5]+.*$/.test(node.value) || node.value.indexOf('\n') > -1
            || node.value.indexOf('\"') > -1 || node.value.indexOf('\\') > -1)
            arr_Literal2.push(code_change_str(str_reverse(node.value)))
          else arr_Literal2.push(str_reverse(node.value))
          counter3++;
          return call_ast.body[0].expression
        } else {
          //
        }
      }

      // 属性字符串 FIXME:属性加密非常影响性能
      if (node.type == 'MemberExpression' && node.property && node.property.type == 'Identifier'
        && node.property.name != '_super' && node.computed == false  && Math.random() <=flagList.MEMBER_ENCRYPT_RATIO) {
 
        // this的属性调用不能处理
        if (node.object && node.object.type == 'ThisExpression') {
          return node;
        } else {
          
          if (node.property.name.length <= 1) {
            return node;
          }

          if(flagList.MEMBER_ENCRYPT_TYPE == 1){//只对属性名转化为unicode，执行性能高很多

            if(node.property.name.length > 3 && node.property.name.length <= 20){
 
              node.computed = true;

              let tmpPropNode = {
                  "type": "Literal",
                  "value": "PI",
                  "raw": "\"PI\""
              };
              let tmpName = code_change_str(str_reverse(node.property.name));
              tmpPropNode.value = tmpName
              tmpPropNode.raw = '\"' + tmpName + '\"';
              
              node.property = tmpPropNode;
              counter4++;
            }

            return node;
          }else{
            node.computed = true;

            //下面的方式很影响性能
            let property = {}
            property.type = 'Literal'
            property.value = node.property.name
            property.raw = '\"' + node.property.name + '\"'
            node.property = property

            let call_ast = esprima.parseScript(func_name[3] + '(' + counter4 + ')')
            let tt = Math.floor(Math.random() * 10 + 1)
            if (tt < 3)
              arr_Literal3.push(code_change_str(str_reverse(node.property.value)))
            else arr_Literal3.push(str_reverse(node.property.value))
            counter4++
            node.property = call_ast.body[0].expression
            return node
          }
        }
      }

      // 拿到所有函数名
      if (node.type == 'FunctionDeclaration') {
        if (node.id && node.id.name) {
          func_list.push(node.id.name)
        }
      }
    }
  });
}

/**
 * 追加逆序解密函数
 */
function insertReversedDecodeFunction(sast, num) {
  let addfunc = decodeBase64(decode_func_list.three);
  let tmp = null;
  for (let i = 0; i < (num + 1); i++) {
    tmp = esprima.parseScript(addfunc.toString());
    tmp.body[0].id.name = func_name[i];
    // tmp.body[0].body.body[1].argument.callee.object.callee.object.callee.object.object.name = func_argv[i]
    // console.log("哈哈哈哈",tmp.body[0].body)
    tmp.body[0].body.body[0].argument.object.name = func_argv[i]//不使用反序例化
    sast.body.push(tmp.body[0]);
    if (i == 0) {//第1次后对应顺序+1
      i++;
    }
  }
}

function insertDecodeData(topAST) {

  // 替换参数
  topAST.body[0].expression.argument.callee.params[0].name = func_argv[0]
  topAST.body[0].expression.argument.callee.params[1].name = func_argv[1]
  topAST.body[0].expression.argument.callee.params[2].name = func_argv[2]
  topAST.body[0].expression.argument.callee.params[3].name = func_argv[3]
  topAST.body[0].expression.argument.callee.params[4].name = func_argv[4]
  topAST.body[0].expression.argument.callee.params[5].name = func_argv[5]

  if (DEBUG) console.log('NOTE: start replace args');

  // 替换匿名函数参数，为前边遍历出来的字符串数组
  // console.log(arr_Literal0);
  // console.log(arr_Literal1)
  // console.log(arr_Literal2)
  // console.log(arr_Literal3)
  var qy0 = esprima.parseScript('[\"' + arr_Literal0.join('\",\"') + '\"]');
  var qy1 = esprima.parseScript('[\"' + arr_Literal1.join('\",\"') + '\"]');
  var qy2 = esprima.parseScript('[\"' + arr_Literal2.join('\",\"') + '\"]');
  var qy3 = esprima.parseScript('[\"' + arr_Literal3.join('\",\"') + '\"]')

  topAST.body[0].expression.argument.arguments[0].elements = qy0.body[0].expression.elements;
  topAST.body[0].expression.argument.arguments[1].elements = qy1.body[0].expression.elements;
  topAST.body[0].expression.argument.arguments[2].elements = qy2.body[0].expression.elements;
  topAST.body[0].expression.argument.arguments[3].elements = qy3.body[0].expression.elements;

}

/**
 * 追加unicode解密函数
 */
function insertUnicodeDecodeFunction(sast) {
  let addfunc = decodeBase64(decode_func_list.four);
  let tmp = esprima.parseScript(addfunc.toString());
  tmp.body[0].id.name = func_name[1]
  tmp.body[0].body.body[0].declarations[0].init.object.name = func_argv[1]
  sast.body.push(tmp.body[0])
}

/**
 * 仅提取以var声明的全局变量【语法树第一层的】，FIXME：暂未考虑function声明的全局函数
 * @param {Object} sast 代码语法树
 */
function reserveGlobalName(sast) {
  let globalVal = [];
  let nodeTpl = {
    "type": "ExpressionStatement",
    "expression": {
      "type": "AssignmentExpression",
      "operator": "=",
      "left": { //替换为原节点的id
        "type": "Identifier",
        "name": "need_reserve_global_name"
      },
      "right": {//替换为原节点的init
        "type": "FunctionExpression",
        "id": null,
        "params": [],
        "body": {
          "type": "BlockStatement",
          "body": []
        },
        "generator": false,
        "expression": false,
        "async": false
      }
    }
  };
  let nodeFunctionTpl = {
    "type": "ExpressionStatement",
    "expression": {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
            "type": "Identifier",
            "name": "FunctionName"
        },
        "right": {
            "type": "FunctionExpression",
            "id": null,
            "params": [],
            "body": {
                "type": "BlockStatement",
                "body": []
            },
            "generator": false,
            "expression": false,
            "async": false
        }
    }
  };
  let tmpObj = null;
  let insertArr = null;

  for (let i = 0; i < sast.body.length; i++) {

    insertArr = [];

    //替换function声明的函数
    if (sast.body[i] && sast.body[i].type == 'FunctionDeclaration') {
        tmpObj = JSON.parse(JSON.stringify(nodeFunctionTpl));

        globalVal.push(sast.body[i].id.name);
        
        tmpObj.expression.left = sast.body[i].id;
        tmpObj.expression.right.params = sast.body[i].params;
        tmpObj.expression.right.body = sast.body[i].body;

        sast.body.splice(i,1);
        sast.body.unshift(tmpObj);//部分代码声明在调用之后
    }

    //替换var声明的变量
    if (sast.body[i] && sast.body[i].type == 'VariableDeclaration' && sast.body[i].declarations) {
      for (let j = 0; j < sast.body[i].declarations.length; j++) {
        if(sast.body[i].declarations[j].id.type == 'Identifier'){

          tmpObj = JSON.parse(JSON.stringify(nodeTpl));

          globalVal.push(sast.body[i].declarations[j].id.name);
          
          tmpObj.expression.left = sast.body[i].declarations[j].id;
          tmpObj.expression.right = sast.body[i].declarations[j].init || {
                "type": "Literal",
                "value": null,
                "raw": "null"
            };//部分代码只声明不赋值

          insertArr.push(tmpObj);
        }
      }
      sast.body.splice(i, 1, ...insertArr);

    }

  }

  return globalVal;
}

function insertGlobalName(sast, globalVal){
  let nodeTpl = {
    "type": "VariableDeclaration",
    "declarations": [
        {
            "type": "VariableDeclarator",
            "id": {
                "type": "Identifier",
                "name": "bb"
            },
            "init": {
                "type": "Literal",
                "value": null,
                "raw": "null"
            }
        }
    ],
    "kind": "var"
  };
  let tmpNode = null;

  for (let i = 0; i < globalVal.length; i++) {
    tmpNode = JSON.parse(JSON.stringify(nodeTpl));
    tmpNode.declarations[0].id.name = globalVal[i];
    sast.body.unshift(tmpNode);
  }  
}

/**
 * 开始对单个JS文件进行加密
 * @param {String} filename 待加密JS文件的路径
 */
function file_enc(filename) {

  // 每个文件加密前清空（保存字符串的数组和计数器）
  arr_Literal0 = []
  arr_Literal1 = []
  arr_Literal2 = []
  arr_Literal3 = []
  arr_Literal5 = []
  arr_Literal6 = []
  counter1 = 0;
  counter2 = 0;
  counter3 = 0;
  counter4 = 0;
  counter5 = 0;
  counter6 = 0;

  console.log('NOTE: start encrypting file ' + filename);
  process.stdout.write('NOTE: start encrypting file ' + filename+'\n');
  let filecode = fs.readFileSync(filename);

  // 自动备份js文件
  if (DEBUG && BACKUP) {
    try {
      if (!fs.existsSync(filename + ".bak")) {
        fs.writeFileSync(filename + ".bak", filecode);
      }
    } catch (err) {
      console.error("文件备份错误.\n" + err.message);
      return;
    }
  }

  // 解析源代码到语法树，如果解析失败，则调用一次babel-core进行 ES6 --> ES5转换
  if (DEBUG) console.log('NOTE: use esprima.');
  filecode = filecode.toString();
  let sast = '';
  for (let i = 0; i < 2; i++) {
    if (sast == '') {
      try {
        // if (ES5) {
        //   console.log("NOTE:转换es6")
        //   filecode = BB.transform(filecode, {
        //     presets: ["es2015"]
        //   }).code;
        //   console.log(filecode);
        // }
        sast = esprima.parseScript(filecode);
      } catch (err) {
        if (DEBUG) console.log("NOTE: ES6")
        if (ES5) {
          filecode = BB.transform(filecode, {
            presets: ["es2015"]
          }).code;
        }
        sast = esprima.parseScript(filecode);
      }
    }
  }

  let source_code = null;
  let tmp_code = undefined;
  //没走obf 并且需要防日志泄露
  if(flagList.ANTI_LOG && Boolean(flagList.COMPATIBLE)){
    const sourcecode = decodeBase64(decode_func_list.seven);
    const tree = esprima.parseScript(sourcecode);
    sast.body.unshift(tree.body[0])
  }

  if(!flagList.CODE_OBF||flagList.CODE_OBF){

    if(flagList.RESERVE_GLOBAL_NAME){
      globalVal = reserveGlobalName(sast);
    }

    // 开始处理
    try {
      if (DEBUG) console.log('NOTE: start handle_rec0.');
      handle_rec0(sast);
    } catch (err) {
      console.error("加密失败.\n" + err.message);
      return;
    }
    // console.log("NOTE: encrypt success.");

    //匿名函数
    if (DEBUG) console.log('NOTE: start add__/1.js');
    var topfunc = decodeBase64(decode_func_list.one);

    var topfunc2 = null;
    // if (ANTI_DEBUG) 
    //   topfunc2 = fs.readFileSync('./add__/2__.js')
    // else
    //   topfunc2 = fs.readFileSync('./add__/2.js')

    topfunc2 = decodeBase64(decode_func_list.two);

    // console.log('ANTI_DEBUG',ANTI_DEBUG);
    // console.log(JSON.stringify(topfunc2.toString()));

    var tmp = esprima.parseScript(topfunc.toString());
    var tmp2 = esprima.parseScript(topfunc2.toString());
    console.log("插入函数",sast);
    //插入3段解密函数
    insertReversedDecodeFunction(sast, 3);

    // 追加unicode解密函数1
    insertUnicodeDecodeFunction(sast);

    // 追加全局变量(混淆后会检测解密函数名长度，一般不超过3，防修改，解密函数加了验证代码)
    var addfunc = decodeBase64(decode_func_list.five);
    var tmp5 = esprima.parseScript(addfunc.toString());
    sast.body.unshift(tmp5.body[0])

    insertDecodeData(tmp);

    tmp2.body[0].expression.argument.callee.body.body = sast.body
    tmp.body[0].expression.argument.callee.body.body = tmp2.body;

    //打印加密的数量
    console.log('1~3 counter1',counter1);
    console.log('4~20 [异或] counter2',counter2);
    console.log('20 + counter3',counter3);
    console.log('member counter4',counter4);

    //在语法树顶部插入全局变量声明
    if(flagList.RESERVE_GLOBAL_NAME){
      insertGlobalName(tmp, globalVal);
    }
    if (DEBUG) console.log('NOTE: generate source_code');
    source_code = escodegen.generate(tmp);
  }else{
    source_code = escodegen.generate(sast);
  }
  //利用jsobf工具自带的反调试功能，混淆功能提交膨胀太多，APK中可以用
//   console.log(flagList.CODE_OBF)
//  console.log(flagList)
//  process.exit(1);
  const controlFlow = Boolean(Number(flagList.CODE_OBF));
  if(!Boolean(flagList.COMPATIBLE)){
    process.stdout.write("NOTE:start confusion...\n")
    result = jsobf.obfuscate(source_code, {
      compact: true,
      stringArray: false,
      rotateStringArray:false,// true,
      identifierNamesGenerator: 'mangled',
      deadCodeInjection: false,
      deadCodeInjectionThreshold: 0.4,
      controlFlowFlattening: controlFlow,
      controlFlowFlatteningThreshold:flagList.CODE_OBF,
      debugProtection: !!flagList.ANTI_DEBUG,
      debugProtectionInterval:!!flagList.ANTI_DEBUG,
      disableConsoleOutput: Boolean(flagList.ANTI_LOG),
      renameGlobals: false,
      selfDefending: false,
      stringArrayEncoding: false,
      stringArrayThreshold: 0,//0.75,
      unicodeEscapeSequence: false,
    })
    tmp_code = result.getObfuscatedCode()
    process.stdout.write("NOTE:end confusion...\n")
  }else{
    process.stdout.write("NOTE:start obf...\n");
    let result = uglify.minify(source_code);
    if(result.error){
      console.log(result)
      tmp_code=undefined;
    }else{
      tmp_code = result.code;
    }
    process.stdout.write("NOTE:end obf...\n")
  }
  
 
  // console.log(tmp_code)
  if (tmp_code == undefined) {
    process.stdout.write('compress Code error.')
    return;
  }

  // 全局替换__QY__（为什么这样做是因为unicode在转换中会自动还原，所以我在全部操作处理完后最后输出unicode）
  tmp_code = tmp_code.replace(/__QY__/g, '\\u')
  tmp_code = tmp_code.replace(/this\['_super'\]/g, 'this._super');
  if (DEBUG)
    fs.writeFileSync(filename + '.obf.js', tmp_code);
  else
    fs.writeFileSync(filename.replace(/\.js/g, '.sec.js'), tmp_code);
  flag = 1

}

//读取指定文件夹下所有未加密js文件
function read_all_file(path) {
  let result = [];
  function finder(path) {
    let files = fs.readdirSync(path);
    files.forEach((val, index) => {
      let fPath = JO(path, val);
      let stats = fs.statSync(fPath);
      if (stats.isDirectory()) finder(fPath);
      if (stats.isFile()) result.push(fPath);
    });
  }
  finder(path);
  return result;
}

function start_enc(path) {
  try {
    let result1 = fs.lstatSync(path);
    if (result1.isDirectory()) {
      dirlist = read_all_file(path);
    } else {
      dirlist[0] = path;
    }
  } catch (err) {
    console.error('文件路径错误.\n' + err);
    process.stderr.write('文件路径错误.\n' + err+"\n")
    return;
  }
  // console.log(dirlist)
  for (let i = 0; i < dirlist.length; i++) {
    try {

      // 判断文件是否忽略
      if (ignore(dirlist[i].toString())) return;

      // 开始加密
      file_enc(dirlist[i].toString())

    } catch (err) {
      console.error(err)
      err_list.push(dirlist[i])
    } finally {
      continue
    }
  }
}

func_argv = genFuncArgv();
func_name = genFuncName();

console.log(func_argv,'\n',func_name)

//开始加密文件
start_enc(process.argv[2]);

if (err_list.length) {
  console.error(`NOTE: 加密失败的文件:${err_list}`);
  process.stdout.write(`NOTE: 加密失败的文件:${err_list}`)
} else {
  //FIXME:flag是所有文件成功的标志 ？
  process.stdout.write(`退出码：${flag}`)
  if (flag == 1){
    console.log("NOTE: Finished."),process.stdout.write('\nNOTE:Finished\n');
  } 
  
}

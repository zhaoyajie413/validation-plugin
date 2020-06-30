/**
 * 表单序列化
 * @returns {string}
 */
serialize = function(){
    var res = [],   //存放结果的数组
        current = null, //当前循环内的表单控件
        i,  //表单NodeList的索引
        len, //表单NodeList的长度
        k,  //select遍历索引
        optionLen,  //select遍历索引
        option, //select循环体内option
        optionValue,    //select的value
        form = this;    //用form变量拿到当前的表单，易于辨识

    for(i=0, len=form.elements.length; i<len; i++){

        current = form.elements[i];

        //disabled表示字段禁用，需要区分与readonly的区别
        if(current.disabled) continue;

        switch(current.type){
            //可忽略控件处理
            case "file":    //文件输入类型
            case "submit":  //提交按钮
            case "button":  //一般按钮
            case "image":   //图像形式的提交按钮
            case "reset":   //重置按钮
            case undefined: //未定义
                break;
            //select控件
            case "select-one":
            case "select-multiple":
                if(current.name && current.name.length){
                    console.log(current)
                    for(k=0, optionLen=current.options.length; k<optionLen; k++){
                        option = current.options[k];
                        optionValue = "";
                        if(option.selected){
                            if(option.hasAttribute){
                                optionValue = option.hasAttribute('value') ? option.value : option.text
                            }else{
                                //低版本IE需要使用特性 的specified属性，检测是否已规定某个属性
                                optionValue = option.attributes('value').specified ? option.value : option.text;
                            }
                        }
                        res.push(encodeURIComponent(current.name) + "=" + encodeURIComponent(optionValue));
                    }
                }
                break;

            //单选，复选框
            case "radio":
            case "checkbox":
                //这里有个取巧 的写法，这里的判断是跟下面的default相互对应。
                //如果放在其他地方，则需要额外的判断取值
                if(!current.checked) break;

            default:
                //一般表单控件处理
                if(current.name && current.name.length){
                    res.push(encodeURIComponent(current.name) + "=" + encodeURIComponent(current.value));
                }
        }
    }
    return res.join("&");
}

/**
 * 序列化转json
 * @param query
 * @returns {{}}
 */
function parseQuery (query) {
    var res = {};

    query = query.trim().replace(/^(\?|#|&)/, '');

    if (!query) {
        return res
    }

    query.split('&').forEach(function (param) {
        var parts = param.replace(/\+/g, ' ').split('=');
        console.log(parts)
        var key = decodeURIComponent(parts.shift());
        console.log(key)
        var val = parts.length > 0
            ?  decodeURIComponent(parts.join('='))
            : null;
        if (res[key] === undefined) {
            res[key] = val;
        } else if (Array.isArray(res[key])) {
            res[key].push(val);
        } else {
            res[key] = [res[key], val];
        }
    });

    return res
}

const defaultOptions = {
    form:null,
    rules:{},
    errorCallback:function (error) {
        console.error(`${error.name}:${error.message}`)
    }
}

/**
 * 校验类
 * @param formElement
 * @param rules
 * @returns {boolean}
 */
function Validation(options) {
    options={...defaultOptions,...options};
    this.form = options.form;
    this.rules = options.rules;
    this.errorCallback = options.errorCallback;
    this.errors = [];
    return this;
}

/**
 * 校验
 * @callback
 */
Validation.prototype.validate=function (callback) {
    let _this = this;
    let data =  parseQuery(serialize.call(this.form)),rules=this.rules;
    this.errors = [];
    for(let k in data){
        if(rules[k] instanceof Array){
            rules[k].forEach(function (rule) {
               _this.validateField(rule,k,data[k]);
            })
        }else {
            _this.validateField(rules[k],k,data[k]);
        }
    }
    this.dispatchErrors();
    callback(this.valide())
}
/**
 * 抛错方法
 */
Validation.prototype.dispatchErrors=function(){
    let _this = this;
    if(this.errors.length>0){
        this.errors.forEach(function (error) {
            console.log(error)
            _this.errorCallback(error)
        })
    }
}
/**
 * 是否通过校验
 * @returns {boolean}
 */
Validation.prototype.valide=function () {
    return !this.errors.length>0
}
/**
 * 单个校验的方法
 * @param rule
 * @param name
 * @param data
 */
Validation.prototype.validateField = function(rule,name,data) {
    let _this = this;
    for(let key in rule){
        switch (key) {
            case 'required':
                if(!_this.required(rule[key],data))
                    _this.errors.push({name:name,message:rule.message?rule.message:`${name}必须填写`});
                break;
            case 'pattern':
                if(!_this.pattern(rule[key],data))
                    _this.errors.push({name:name,message:rule.message?rule.message:`${name}必须填写`});
                break;
            case 'validator':
                if(!rule[key](data))
                    _this.errors.push({name:name,message:rule.message?rule.message:`${name}必须填写`});
                break;
        }
    }
}
/**
 * 判断是否为空
 * @param bool
 * @param param
 * @returns {boolean}
 */
Validation.prototype.required = function (bool,param) {
    if(!bool)return true;
    if(param==="" || param===null || param === undefined){
        return  false
    }else{
        return true;
    }
}

/**
 * 正则校验
 * @param reg
 * @param param
 * @returns {*}
 */
Validation.prototype.pattern = function (reg,param) {
    return reg.test(param);
}

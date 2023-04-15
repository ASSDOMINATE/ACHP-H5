$(function () {
    $('#send-button').click(send);
    $('#footer-line-icon').click(reload);
    $('#login-button').click(login);
    $('#recharge-button').click(recharge);
    $('#register-button').click(register);
    $('#dark-mode-button').click(changeMode);
    init();
})

let BASE_URL = 'http://8.219.111.33/';
let REQUEST_TOKEN = null;

// 返回结果Code常量
const RESPONSE_NEED_LOGIN_CODE = 401;
const RESPONSE_SUCCESS_CODE = 200;

//缓存
const CACHE_USER_KEY = 'achp:cache:user';
const CACHE_TOKEN_KEY = 'achp:cache:token';

let CURRENT_DARK_MODE = false;

function changeMode() {
    if (CURRENT_DARK_MODE) {
        $('#dark-mode-button .light-icon').hide();
        $('#dark-mode-button .dark-icon').show();
        $('body').removeClass('dark-mode');
    } else {
        $('#dark-mode-button .light-icon').show();
        $('#dark-mode-button .dark-icon').hide();
        $('body').addClass('dark-mode');
    }
    CURRENT_DARK_MODE = !CURRENT_DARK_MODE;
}

function sendCopy() {
    let content = $(this).prev().text();
    copy(content);
}

function copy(content) {
    let $input = $('#send-input');
    let temp = $input.val();
    $input.val(content);
    const inputElement = document.querySelector('#send-input');
    inputElement.select();
    document.execCommand('copy');
    $input.val(temp);
    showAlert('已复制到粘贴板');
}


let START_REGISTER = false;

function register() {
    let $loginInputs = $('#login-inputs');
    let $registerInputs = $('#register-inputs');
    if (!START_REGISTER) {
        $loginInputs.hide();
        $('#top-message').hide();
        $registerInputs.show();
        START_REGISTER = true;
        return;
    }
    START_REGISTER = false;
    let sign = $('#register-sign').val();
    let pwd1 = $('#register-pwd-1').val();
    let pwd2 = $('#register-pwd-2').val();
    if (!sign) {
        showAlert('账号不能为空');
        setLogoutPage();
        return;
    }
    if (!pwd1) {
        showAlert('密码不能为空');
        setLogoutPage();
        return;
    }
    if (!pwd2) {
        showAlert('重复密码不能为空');
        setLogoutPage();
        return;
    }
    if (pwd1 !== pwd2) {
        showAlert('重复密码不一致');
        setLogoutPage();
        return;
    }
    if (pwd1.length < 6) {
        showAlert('密码必须大于6位');
        setLogoutPage();
        return;
    }
    let param = {
        'sign': sign,
        'pwd': pwd1
    }
    postRequest('api/auth/register', JSON.stringify(param), register_render);
}

function register_render(response) {
    if (response.code !== RESPONSE_SUCCESS_CODE) {
        showAlert(response.msg);
        setLogoutPage();
        return;
    }
    REQUEST_TOKEN = response.data;
    window.localStorage.setItem(CACHE_TOKEN_KEY, REQUEST_TOKEN);
    setLoginPage();
}


// 开始兑换标记
let START_RECHARGE = false;

/**
 * 充值兑换接口
 */
function recharge() {
    if (!REQUEST_TOKEN) {
        showAlert('请登陆后使用');
        return;
    }
    let $exchangeCode = $('#exchange-code');
    let $exchangeInputs = $('#exchange-inputs');
    let $topMessage = $('#top-message');
    let $rechargeButton = $('#recharge-button');

    // 开启兑换状态
    if (!START_RECHARGE) {
        $exchangeCode.val('');
        $exchangeInputs.show();
        $topMessage.hide();
        START_RECHARGE = true;
        return;
    }

    // 进行兑换，并关闭兑换
    START_RECHARGE = false;
    $topMessage.show();
    $exchangeInputs.hide();
    let exchangeCode = $exchangeCode.val();
    if (exchangeCode.length === 0) {
        showAlert('请输入有效的兑换码');
        return;
    }

    //TODO 兑换卡密接口
    showAlert('兑换成功');
}

let START_LOGIN = false;

/**
 * 登陆接口
 */
function login() {
    let $loginInputs = $('#login-inputs');
    let $registerInputs = $('#register-inputs');
    let $loginButton = $('#login-button');
    // 已登陆状态直接清除状态退出
    if ($loginButton.text() === '退出') {
        setLogoutPage();
        return;
    }
    if (START_REGISTER) {
        $loginInputs.show();
        $registerInputs.hide();
        START_REGISTER = false;
        return;
    }

    if (!START_LOGIN) {
        $loginInputs.show();
        $('#top-message').hide();
        START_LOGIN = true;
        return;
    }
    START_LOGIN = false;

    let sign = $('#login-sign').val();
    let pwd = $('#login-pwd').val();
    let param = {
        'sign': sign,
        'pwd': pwd
    }
    postRequest('api/auth/login', JSON.stringify(param), login_render);
}

function login_render(response) {
    if (response.code !== RESPONSE_SUCCESS_CODE) {
        showAlert(response.msg);
        setLogoutPage();
        return;
    }
    REQUEST_TOKEN = response.data;
    window.localStorage.setItem(CACHE_TOKEN_KEY, REQUEST_TOKEN);
    setLoginPage();
}

/**
 * 页面初始化参数
 */
function init() {
    REQUEST_TOKEN = window.localStorage.getItem(CACHE_TOKEN_KEY);
    if (!REQUEST_TOKEN) {
        setLogoutPage();
        return;
    }
    setLoginPage();
}

/**
 * 设置登陆后页面
 */
function setLoginPage() {
    $('#login-button').text('退出');
    $('#login-inputs,#exchange-inputs,#register-button,#register-inputs').hide();
    $('#login-button,#recharge-button').show();
    $('#top-message').text('正在检查账号状态 ...').show();
    getRequest('api/auth/user', null, setLoginPage_render);
}

function setLoginPage_render(response) {
    if (response.code !== RESPONSE_SUCCESS_CODE) {
        showAlert(response.msg);
        setLogoutPage();
        return;
    }
    let user = response.data;
    window.localStorage.setItem(CACHE_USER_KEY, JSON.stringify(user));
    // TODO check user state
    $('#top-message').text('您还不是付费用户，赶快去购卡充值吧！').show();
}

/**
 * 设置登出后页面
 */
function setLogoutPage() {
    window.localStorage.removeItem(CACHE_TOKEN_KEY);
    REQUEST_TOKEN = null;
    START_REGISTER = false;
    START_LOGIN = false;
    START_RECHARGE = false;
    $('#login-button').text('登陆');
    $('#register-button,#login-button,#top-message').show();
    $('#login-inputs,#exchange-inputs,#recharge-button,#register-inputs').hide();
}

/**
 * 显示提示消息
 * @param message 提示信息
 */
function showAlert(message) {
    let $message = $('#float-message-area');
    if (!$message.is(':hidden')) {
        return;
    }
    $message.text(message).show();
    const width = parseNum($message.css('width'))
        + parseNum($message.css('padding-left'))
        + parseNum($message.css('padding-right'));
    const htmlWidth = parseNum($('html').css('width').replace('px', ''));
    const left = (htmlWidth - width) / 2;
    $message.css('left', left + 'px');
    setTimeout(function () {
        $('#float-message-area').hide();
    }, 1900);
}

function parseNum(numberStr) {
    return parseInt(numberStr.replace('px', '').replace('%', ''));
}

function reload() {
    if (ON_SENDING) {
        showAlert('接收回复中，请勿刷新');
        return;
    }
    if (!confirm("刷新会清空当前对话，是否确认？")) {
        return;
    }
    location.replace(location.href);
}

function toBottom() {
    window.scrollTo(0, document.documentElement.scrollHeight)
}

// 当前会话ID
let CHAT_GROUP_ID = "";
// 正在发送标记
let ON_SENDING = false;
// 代码块
let CODE_TYPE_LIST = ['C', 'Java', 'C#', 'Python', 'PHP', 'JavaScript', 'Go', 'Objective-C', 'Swift'];


let SSE_SOURCE = null;
let LAST_SENTENCE = "";

function send() {
    if (!REQUEST_TOKEN) {
        showAlert('请登陆后使用');
        return;
    }
    let $input = $('#send-input');
    let sentence = $input.val();
    if (ON_SENDING) {
        SSE_SOURCE.close();
        refreshSendState(sentence, '请输入');
        return;
    }
    if (!sentence || sentence.length === 0) {
        return;
    }
    LAST_SENTENCE = sentence;
    // 设置发送状态
    refreshSendState('', '接收回复中 ...');

    // 建立 SSE
    let uri = encodeURI('sentence=' + sentence + '&chat_id=' + CHAT_GROUP_ID);
    SSE_SOURCE = new EventSourcePolyfill(BASE_URL + 'stream/chat/send' + '?' + uri, {
        headers: {'token': REQUEST_TOKEN}
    });

    // 准备接收区域
    let $chatArea = $('#chat-area');
    let $userSend = $('<div class="user-send" role="user"><span class="send-role">Q</span><span class="content">' + sentence + '</span><div class="copy-button">复制<div/></div>');
    let $assistantSend = $('<div class="assistant-send" role="assistant"><div class="send-role">AI</div><div class="reply"></div><div class="copy-button">复制<div/></div>');
    let $reply = $assistantSend.find('.reply');
    $chatArea.append($userSend);
    $chatArea.append($assistantSend);
    $reply.append('<span id="input-block"></span>');
    $userSend.find('.copy-button').click(sendCopy);
    $assistantSend.find('.copy-button').click(sendCopy);

    $('#default-block').hide();
    $chatArea.show();
    toBottom();

    // 代码块标记计数
    let codeSignCount = 0;
    let targetCodeSignCount = 3;
    // 当前代码块对象
    let $code;
    let $pre;
    // 是否进入代码时间
    let codeTime = false;
    // 代码类型
    let codeType;
    SSE_SOURCE.addEventListener('message', function (event) {
        let data = JSON.parse(event.data);
        let role = data.role;
        switch (role) {
            case 'sign':
                // 返回结果是对话组ID
                CHAT_GROUP_ID = data.content;
                break;
            case 'assistant':
                // AI返回的结果
                let content = data.content;
                // 1.检查代码标记
                let thisSignCount = checkCodeSign(content);
                // 3.2 代码时间
                if (codeTime) {
                    // 3.2.1 第一条消息为代码类型 - 设置代码类型到 $code
                    if (!codeType) {
                        for (let type of CODE_TYPE_LIST) {
                            if (content.toLowerCase() === type.toLowerCase()) {
                                codeType = content.toLowerCase();
                                $code.addClass('language-' + codeType);
                                hljs.highlightAll();
                                break;
                            }
                        }
                        hljs.highlightAll();
                    }
                    // 3.2.2 不是代码标记 - 拼接代码
                    if (thisSignCount === 0) {
                        $code.append('<span>' + content + '</span>');
                        $code.append($('#input-block'));
                        toBottom();
                        break;
                    }
                    // 3.2.3 代码结束标记检查
                    codeSignCount += thisSignCount;
                    if (codeSignCount === targetCodeSignCount) {
                        hljs.highlightAll();
                        // over code time
                        codeTime = false;
                        break;
                    }
                    break;
                }
                // 2.不是代码标记 - 拼接文字
                if (thisSignCount === 0) {
                    codeSignCount = 0;
                    codeType = null;
                    $reply.append('<span>' + content + '</span>');
                    $reply.append($('#input-block'));
                    toBottom();
                    break;
                }
                // 3.代码开始标记检查
                codeSignCount += thisSignCount;
                // 3.1 开始代码时间
                if (codeSignCount === targetCodeSignCount) {
                    // start code time
                    $pre = $('<pre></pre>');
                    $code = $('<code></code>');
                    $pre.append($code);
                    $reply.append($pre);
                    codeTime = true;
                    codeType = null;
                    codeSignCount = 0;
                }
                break;
            case 'code':
                // 对话结束标记，返回对话ID
                SSE_SOURCE.close();
                refreshSendState('', '请输入');
                break;
        }
    }, false);

    SSE_SOURCE.addEventListener('error', function (event) {
        // 连接出现异常
        console.log(event);
        SSE_SOURCE.close();
        refreshSendState(sentence, '请输入');
        // 显示提示消息
        $reply.append('<span>网络出现问题，您可以点击发送重试，继续对话</span>');
        toBottom();
    }, false);
}

function refreshSendState(inputValue, inputHolder) {
    let $input = $('#send-input');
    $input.val(inputValue).attr('placeholder', inputHolder);
    let $button = $('#send-button');
    $input.attr("readonly", !ON_SENDING);
    ON_SENDING = !ON_SENDING;
    if (ON_SENDING) {
        $button.text('中止').addClass('disabled');
        return;
    }
    $('#input-block').remove();
    $button.text('发送').removeClass('disabled');
}


/**
 * 检查代码标记
 * @param content 文字
 * @returns {number} 标记数量
 */
function checkCodeSign(content) {
    let checkContent = content.replace(/(^\s*)|(\s*$)/g, '').replace(/<\/?.+?>/g, '').replace(/[\r\n]/g, '');
    switch (checkContent.length) {
        case 1:
            if ('`' === checkContent) {
                return 1;
            }
            return 0;
        case 2:
            if ('``' === checkContent) {
                return 2;
            }
            return 0;
        case 3:
            if ('```' === checkContent) {
                return 3;
            }
            return 0;
        default:
            return 0;
    }
}


function sentRequest(url, params, render, type) {
    if (REQUEST_TOKEN == null) {
        REQUEST_TOKEN = window.localStorage.getItem(CACHE_TOKEN_KEY);
    }
    $.ajax({
        url: BASE_URL + url,
        data: params,
        success: function (response) {
            if (checkState(response)) {
                render(response)
            }
        },
        beforeSend: function (request) {
            request.setRequestHeader('token', REQUEST_TOKEN);
        },
        dataType: 'json',
        contentType: 'application/json;charset=UTF-8',
        type: type,
    });
}

function checkState(response) {
    if (response.code === RESPONSE_NEED_LOGIN_CODE) {
        setLogoutPage();
        return false;
    }
    return true;
}

function getRequest(url, params, render) {
    sentRequest(url, params, render, 'GET');
}

function postRequest(url, params, render) {
    sentRequest(url, params, render, 'POST');
}


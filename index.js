"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const telegraf_session_local_1 = __importDefault(require("telegraf-session-local"));
const { enter, leave } = telegraf_1.Scenes.Stage;
//'https://github.com/telegraf/telegraf/blob/v4/docs/examples/shop-bot.js'
const token = '5402827780:AAF01sQIeYuMB_qEimFS9eR5kCdVj6ifkz8';
if (token === undefined) {
    throw new Error('BOT_TOKEN must be provided!');
}
const stepHandler = new telegraf_1.Composer();
stepHandler.action('next', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    ctx.scene.session.myWizardSessionProp = Math.floor(10 * Math.random());
    ctx.session.mySessionProp = -Math.floor(10 * Math.random());
    yield ctx.reply('Step 2. Via inline button');
    return ctx.wizard.next();
}));
stepHandler.command('next', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    ctx.scene.session.myWizardSessionProp = Math.floor(10 * Math.random()) + 10;
    ctx.session.mySessionProp = -Math.floor(10 * Math.random()) - 10;
    yield ctx.reply('Step 2. Via command');
    return ctx.wizard.next();
}));
stepHandler.use((ctx) => ctx.replyWithMarkdown('Press `Next` button or type /next'));
const superWizard = new telegraf_1.Scenes.WizardScene('super-wizard', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply('Step 1', telegraf_1.Markup.inlineKeyboard([
        telegraf_1.Markup.button.url('❤️', 'http://telegraf.js.org'),
        telegraf_1.Markup.button.callback('➡️ Next', 'next'),
    ]));
    return ctx.wizard.next();
}), stepHandler, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const responseText = [
        `[${ctx.myContextProp}] Step 3.`,
        `Your random myWizardSessionProp is ${ctx.scene.session.myWizardSessionProp}`,
        `Your random mySessionProp is ${ctx.session.mySessionProp}`,
    ].join('\n');
    yield ctx.reply(responseText);
    return ctx.wizard.next();
}), (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply('Step 4');
    return ctx.wizard.next();
}), (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply('Done');
    return yield ctx.scene.leave();
}));
const echoScene = new telegraf_1.Scenes.BaseScene('echo');
echoScene.enter((ctx) => ctx.reply('echo scene'));
echoScene.leave((ctx) => ctx.reply('exiting echo scene'));
echoScene.command('back', leave());
echoScene.on('text', (ctx) => ctx.reply(ctx.message.text));
echoScene.on('message', (ctx) => ctx.reply('Only text messages please'));
const bot = new telegraf_1.Telegraf(token);
const stage = new telegraf_1.Scenes.Stage([superWizard, echoScene], {
    default: 'echo',
});
// bot.on('text', (ctx) => ctx.reply('sdfsdf'))
bot.use(new telegraf_session_local_1.default({ database: 'session.json' }).middleware());
bot.command('onetime', (ctx) => ctx.reply('One time keyboard', telegraf_1.Markup
    .keyboard(['/simple', '/inline', '/pyramid', '/forceReply'])
    .oneTime()
    .resize()));
bot.command('image', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }));
bot.command('test', (ctx) => ctx.reply('One time keyboard', {
    reply_markup: {
        inline_keyboard: [
            /* Inline buttons. 2 side-by-side */
            [{ text: "Button 1", callback_data: "btn-1" }, { text: "Button 2", callback_data: "btn-2" }],
            /* One button */
            [{ text: "Next", callback_data: "next" }],
            /* Also, we can have URL buttons. */
            [{ text: "Open in browser", url: "telegraf.js.org" }]
        ]
    }
}));
bot.command('custom', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    return yield ctx.reply('Custom buttons keyboard', telegraf_1.Markup
        .keyboard([
        ['🔍 Search', '😎 Popular'],
        ['☸ Setting', '📞 Feedback'],
        ['📢 Ads', '⭐️ Rate us', '👥 Share'] // Row3 with 3 buttons
    ])
        .oneTime()
        .resize());
}));
bot.command('echo', (ctx) => ctx.scene.enter('echo'));
bot.use((ctx, next) => {
    const now = new Date();
    ctx.myContextProp = now.toString();
    return next();
});
bot.use(stage.middleware());
bot.launch();
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

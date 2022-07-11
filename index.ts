import { Composer, Context, Markup, Scenes, Telegraf } from 'telegraf'
import LocalSession from 'telegraf-session-local';
const { enter, leave } = Scenes.Stage

//'https://github.com/telegraf/telegraf/blob/v4/docs/examples/shop-bot.js'

const token = '5402827780:AAF01sQIeYuMB_qEimFS9eR5kCdVj6ifkz8'
if (token === undefined) {
	throw new Error('BOT_TOKEN must be provided!')
}

/**
 * It is possible to extend the session object that is available to each wizard.
 * This can be done by extending `WizardSessionData` and in turn passing your
 * own interface as a type variable to `WizardSession` and to
 * `WizardContextWizard`.
 */
interface MyWizardSession extends Scenes.WizardSessionData {
	// will be available under `ctx.scene.session.myWizardSessionProp`
	myWizardSessionProp: number
}

/**
 * We can still extend the regular session object that we can use on the
 * context. However, as we're using wizards, we have to make it extend
 * `WizardSession`.
 *
 * It is possible to pass a type variable to `WizardSession` if you also want to
 * extend the wizard session as we do above.
 */
interface MySession extends Scenes.WizardSession<MyWizardSession> {
	// will be available under `ctx.session.mySessionProp`
	mySessionProp: number
}

/**
 * Now that we have our session object, we can define our own context object.
 *
 * As always, if we also want to use our own session object, we have to set it
 * here under the `session` property. In addition, we now also have to set the
 * scene object under the `scene` property. As we extend the scene session, we
 * need to pass the type in as a type variable once again.
 *
 * We also have to set the wizard object under the `wizard` property.
 */
interface MyContext extends Context {
	// will be available under `ctx.myContextProp`
	myContextProp: string

	// declare session type
	session: MySession
	// declare scene type
	scene: Scenes.SceneContextScene<MyContext, MyWizardSession>
	// declare wizard type
	wizard: Scenes.WizardContextWizard<MyContext>
}

const stepHandler = new Composer<MyContext>()
stepHandler.action('next', async (ctx) => {
	ctx.scene.session.myWizardSessionProp = Math.floor(10 * Math.random())
	ctx.session.mySessionProp = -Math.floor(10 * Math.random())
	await ctx.reply('Step 2. Via inline button')
	return ctx.wizard.next()
})
stepHandler.command('next', async (ctx) => {
	ctx.scene.session.myWizardSessionProp = Math.floor(10 * Math.random()) + 10
	ctx.session.mySessionProp = -Math.floor(10 * Math.random()) - 10
	await ctx.reply('Step 2. Via command')
	return ctx.wizard.next()
})
stepHandler.use((ctx) =>
	ctx.replyWithMarkdown('Press `Next` button or type /next')
)

const superWizard = new Scenes.WizardScene(
	'super-wizard',
	async (ctx) => {
		await ctx.reply(
			'Step 1',
			Markup.inlineKeyboard([
				Markup.button.url('❤️', 'http://telegraf.js.org'),
				Markup.button.callback('➡️ Next', 'next'),
			])
		)
		return ctx.wizard.next()
	},
	stepHandler,
	async (ctx) => {
		const responseText = [
			`[${ctx.myContextProp}] Step 3.`,
			`Your random myWizardSessionProp is ${ctx.scene.session.myWizardSessionProp}`,
			`Your random mySessionProp is ${ctx.session.mySessionProp}`,
		].join('\n')
		await ctx.reply(responseText)
		return ctx.wizard.next()
	},
	async (ctx) => {
		await ctx.reply('Step 4')
		return ctx.wizard.next()
	},
	async (ctx) => {
		await ctx.reply('Done')
		return await ctx.scene.leave()
	}
)


const echoScene = new Scenes.BaseScene<MyContext>('echo')
echoScene.enter((ctx) => ctx.reply('echo scene'))
echoScene.leave((ctx) => ctx.reply('exiting echo scene'))
echoScene.command('back', leave<MyContext>())
echoScene.on('text', (ctx) => ctx.reply(ctx.message.text))
echoScene.on('message', (ctx) => ctx.reply('Only text messages please'))


const bot = new Telegraf<MyContext>(token)
const stage = new Scenes.Stage<MyContext>([superWizard, echoScene], {
	default: 'super-wizard',
})
// bot.on('text', (ctx) => ctx.reply('sdfsdf'))
bot.use(new LocalSession({ database: 'session.json' }).middleware());

bot.command('onetime', (ctx) =>
	ctx.reply('One time keyboard', Markup
		.keyboard(['/simple', '/inline', '/pyramid', '/forceReply'])
		.oneTime()
		.resize()
	)
)

bot.command('image', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }));

bot.command('test', (ctx) =>
	ctx.reply('One time keyboard', {
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
	})
)
bot.command('custom', async (ctx) => {
	return await ctx.reply('Custom buttons keyboard', Markup
		.keyboard([
			['🔍 Search', '😎 Popular'], // Row1 with 2 buttons
			['☸ Setting', '📞 Feedback'], // Row2 with 2 buttons
			['📢 Ads', '⭐️ Rate us', '👥 Share'] // Row3 with 3 buttons
		])
		.oneTime()
		.resize()
	)
})

bot.command('echo', (ctx) => ctx.scene.enter('echo'))

bot.use((ctx, next) => {
	const now = new Date()
	ctx.myContextProp = now.toString()
	return next()
})
bot.use(stage.middleware())
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
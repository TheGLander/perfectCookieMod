/**
 * Hello, to add your custom cookie as an option in this, you have to do
 * `new PCSelector.PCType(name, link, maybeIcon, maybeRequirement)`
 * So, instead of `Game.Loader.Replace(bleh)`, maybe do:
 * ```js
 * if (window.PCSelector) {
 * 	new PCSelector.PCType("My awesome cookie", "link to your cookie")
 * } else {
 * 	Game.Loader.Replace("perfectCookie.png", "link to your cookie")
 * }
 * ```
 * (Check out ./sourceCode.ts for readable code!)
 */

interface ModSave {
	selectedType: string
	huBought: boolean
}

declare function writeIcon(icon: Game.Icon): string

namespace PCSelector {
	export const modName = "perfectCookieSelector"
	export const webPath = "https://glander.club/perfectCookieSelector"

	export let save: ModSave = { selectedType: "Default", huBought: false }
	function reportIssue(reason: string): void {
		debugger
		Game.Prompt(`Hi, ${reason}.<br>Please report this. (${modName})`, ["OK"])
	}
	function getModPath(): string {
		if (!App) return webPath
		const steamMod = App.mods[modName]
		if (!steamMod) return webPath
		// This is awful, sorry
		// This finds the second-to-last instance of the forward slash, so
		// ./a/b/c/mods/local/gaming gets local/gaming
		// A lastIndexOf which matches / and \
		function lastIndexOf(str: string, pos?: number): number {
			const forward = str.lastIndexOf("/", pos)
			const backward = str.lastIndexOf("\\", pos)
			return Math.max(forward, backward)
		}
		const splitPoint =
			lastIndexOf(steamMod.dir, lastIndexOf(steamMod.dir) - 1) + 1
		return `../mods/${steamMod.dir.slice(splitPoint)}`
	}

	function getResource(name: string): string {
		return `${getModPath()}/${name}`
	}
	function waitForValue<T>(valFunc: () => T, interval = 100): Promise<T> {
		return new Promise(res => {
			setInterval(() => {
				const val = valFunc()
				if (val) res(val)
			}, interval)
		})
	}
	export function loadTypeImage(type: PCType): void {
		let image: HTMLImageElement
		if (type.link === null) image = Game.Loader.assets["perfectCookie.png"]
		else {
			image = document.createElement("img")
			image.src = type.link
		}
		if (!image) {
			reportIssue("couldn't find the asset image")
		}
		images.set(type, image)
	}
	export const images: Map<PCType, HTMLImageElement> = new Map()
	export const pcTypes: PCType[] = []
	export class PCType {
		constructor(
			public name: string,
			public link: string | null,
			public icon: Game.Icon = [25, 12],
			public reqirement?: () => boolean
		) {
			loadTypeImage(this)
			pcTypes.push(this)
		}
	}
	export class PCCookieType extends PCType {
		constructor(upgrade: Game.Upgrade, link: string) {
			super(upgrade.name, link, upgrade.icon, () => !!upgrade.bought)
		}
	}

	export let ready = false

	export function updatePerfectCookie(): void {
		if (!ready) return
		const selectedType =
			pcTypes.find(
				val => val.name === save.selectedType && val.reqirement?.()
			) || pcTypes.find(val => val.name === "Default")
		if (!selectedType) {
			reportIssue("couldn't find a perfect cookie type")
			return
		}
		const img = images.get(selectedType)
		if (!img) {
			reportIssue("couldn't find the perfect cookie image")
			return
		}
		Game.Loader.assets["perfectCookie.png"] = img
	}
	let hu: Game.HeavenlyUpgrade
	let upgrade: Game.SelectorSwitch

	Game.registerMod(modName, {
		async init(this: Game.Mod) {
			hu = new Game.Upgrade(
				"Dessert showcase",
				`Unlocks the <b>Perfect cookie selector</b>, letting you select your unlocked cookies as the perfect cookie on the left.<br>
Comes with a variety of basic flavors. <q>Show and admire your all cookies like artworks, so sweet~</q>`,
				999,
				[0, 0, getResource("pcs_icon.png")]
			) as Game.HeavenlyUpgrade
			//@ts-expect-error Forgot this in the typings
			hu.ddesc = loc(hu.desc)
			hu.dname = loc(hu.name)
			hu.parents = [Game.Upgrades["Basic wallpaper assortment"]]
			hu.pool = "prestige"
			Game.PrestigeUpgrades.push(hu)
			if (Game.version >= 2.045) {
				hu.posX = 423
				hu.posY = 250
			} else {
				hu.posX = 323
				hu.posY = 273
			}

			upgrade = new Game.Upgrade(
				"Perfect cookie selector",
				"Lets you change how the perfect cookie looks.",
				0,
				[0, 0, getResource("pcs_icon.png")]
			) as Game.SelectorSwitch
			upgrade.descFunc = () => {
				const selectedType =
					pcTypes.find(
						val => val.name === save.selectedType && val.reqirement?.()
					) || pcTypes.find(val => val.name === "Default")
				if (!selectedType) return "what"
				return `<div style="text-align:center;">${loc(
					"Current:"
				)} <div class="icon" style="vertical-align:middle;display:inline-block;${writeIcon(
					selectedType.icon
				)}transform:scale(0.5);margin:-16px;"></div> <b>${loc(
					selectedType.name
				)}</b></div><div class="line"></div>${
					//@ts-expect-error Forgot this in the typings
					upgrade.ddesc
				}`
			}
			//@ts-expect-error Forgot this in the typings
			upgrade.ddesc = loc(upgrade.desc)
			upgrade.dname = loc(upgrade.name)
			upgrade.order = 50000 + upgrade.id / 1000
			upgrade.pool = "toggle"
			//@ts-expect-error This also takes PseudoNulls
			upgrade.choicesFunction = () => {
				return pcTypes.map<Game.SelectorSwitchChoice | Game.PseudoNull>(val => {
					if (val.reqirement && !val.reqirement()) return 0
					return {
						name: loc(val.name),
						icon: val.icon,
						selected: val.name === save.selectedType,
					}
				})
			}
			upgrade.choicesPick = (num: number) => {
				const chosen = pcTypes[num]
				save.selectedType = chosen.name
				updatePerfectCookie()
			}
			Game.registerHook("reset", hard => {
				if (!hard) return
				save.selectedType = "Default"
				save.huBought = false
			})
			Game.registerHook("logic", () => {
				updatePerfectCookie()
			})
			Game.registerHook("reincarnate", () => {
				upgrade.unlocked = hu.bought
				updatePerfectCookie()
			})
			await waitForValue(() => Game.Loader.assets["perfectCookie.png"])
			new PCType("Default", null, [10, 0])
			new PCCookieType(
				Game.Upgrades["Heavenly cookies"],
				getResource("cookieImages/heavenly_cookies.png")
			)
			new PCCookieType(
				Game.Upgrades["Snowflake biscuits"],
				getResource("cookieImages/snowflake_biscuits.png")
			)
			new PCCookieType(
				Game.Upgrades["Pure heart biscuits"],
				getResource("cookieImages/pure_heart_biscuits.png")
			)
			new PCCookieType(
				Game.Upgrades["Ardent heart biscuits"],
				getResource("cookieImages/ardent_heart_biscuits.png")
			)
			new PCCookieType(
				Game.Upgrades["Sour heart biscuits"],
				getResource("cookieImages/sour_heart_biscuits.png")
			)
			new PCCookieType(
				Game.Upgrades["Weeping heart biscuits"],
				getResource("cookieImages/weeping_heart_biscuits.png")
			)
			new PCCookieType(
				Game.Upgrades["Golden heart biscuits"],
				getResource("cookieImages/golden_heart_biscuits.png")
			)
			new PCCookieType(
				Game.Upgrades["Eternal heart biscuits"],
				getResource("cookieImages/eternal_heart_biscuits.png")
			)
			new PCCookieType(
				Game.Upgrades["Prism heart biscuits"],
				getResource("cookieImages/prism_heart_biscuits.png")
			)
			ready = true
			this.load?.(this.save?.() || "")
		},
		save() {
			save.huBought = !!hu.bought
			return JSON.stringify(save)
		},
		load(data) {
			save = JSON.parse(data)
			updatePerfectCookie()
			hu.bought = upgrade.unlocked = save.huBought
			Game.upgradesToRebuild = 1
		},
	})
}

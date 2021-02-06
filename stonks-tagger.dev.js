// ==UserScript==
// @name        Stonks Tagger
// @version     1.0.2-A (2021-02-06)
// @author      serguun42 – userscript
// @author      Moskovskiy × QQ – stonks.xyz
// @description Stonks Tagger – brief info on $cashtags for stonks.xyz in the comments
// @homepage    https://tjournal.ru/tag/osnovanamescacher
// @supportURL  https://tjournal.ru/m/99944
// @match       https://tjournal.ru/*
// @match       https://dtf.ru/*
// @icon        https://stonks.xyz/logo512.png
// @icon64      https://stonks.xyz/logo512.png
// @updateURL   https://serguun42.ru/tampermonkey/stonks-tagger/stonks-tagger.js
// @downloadURL https://serguun42.ru/tampermonkey/stonks-tagger/stonks-tagger.js
// @run-at      document-start
// @grant       none
// @namespace   https://api.stonks.xyz/
// @license     https://creativecommons.org/licenses/by-nc/4.0/legalcode
// ==/UserScript==


const
	SITE = window.location.hostname.split(".")[0],
	SITE_PLATFROM = SITE === "dtf" ? "DTF" : "TJournal",
	RESOURCES_DOMAIN = "serguun42.ru",
	BASE_DOMAIN = `https://stonks.xyz/`,
	API_URL = `https://api.stonks.xyz/api/v1/`,
	VERSION = "1.0.2";




/** @param {String} query @returns {HTMLElement} */ const QS = query => document.querySelector(query);
/** @param {String} query @returns {HTMLElement[]} */ const QSA = query => Array.from(document.querySelectorAll(query));
/** @param {String} query @returns {HTMLElement} */ const GEBI = query => document.getElementById(query);
/** @param {HTMLElement} elem @returns {void} */ const GR = elem => {
	if (elem instanceof HTMLElement)
		(elem.parentElement || elem.parentNode).removeChild(elem);
};


/**
 * @param {String} iKey
 * @returns {Promise.<HTMLElement>}
 */
const GlobalWaitForElement = iKey => {
	if (iKey === "document.body") {
		if (document.body) return Promise.resolve(document.body);

		return new Promise((resolve) => {
			let interval = setInterval(() => {
				if (document.body) {
					clearInterval(interval);
					resolve(document.body);
				};
			}, 50);
		});
	} else {
		if (QS(iKey)) return Promise.resolve(QS(iKey));

		return new Promise((resolve) => {
			let interval = setInterval(() => {
				if (QS(iKey)) {
					clearInterval(interval);
					resolve(QS(iKey));
				};
			}, 50);
		});
	};
};

/**
 * @param {String} iMessageText
 */
const GlobalShowOsnovaMessage = (iMessageText) => {
	if (!iMessageText) return;
	
	const notification = document.createElement("div");
		  notification.className = "notify__item notify__item--success";
		  notification.style.height = "74px";
		  notification.innerHTML = `<i><svg class="icon icon--ui_success" width="100%" height="100%"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#ui_success"></use></svg></i><p>${iMessageText}</p>`;

	document.getElementById("notify").appendChild(notification);


	setTimeout(() => {
		notification.classList.add("notify__item--shown");

		setTimeout(() => {
			notification.style.height = "unset";
			notification.classList.add("notify__item--swiped");

			setTimeout(() => GlobalRemove(notification), 350);
		}, 4e3);
	}, 2e2);
};

/**
 * @callback AnimationStyleSettingFunc
 * @param {Number} iProgress
 */
/**
 * @param {Number} iDuration
 * @param {AnimationStyleSettingFunc} iStyleSettingFunc - Function for setting props by progress
 * @param {"ease-in-out"|"ripple"|"linear"} [iCurveStyle="ease-in-out"] - Curve Style
 * @returns {Promise<null>}
 */
const GlobalAnimation = (iDuration, iStyleSettingFunc, iCurveStyle = "ease-in-out") => new Promise((resolve) => {
	const startTime = performance.now();

	const LocalAnimation = iPassedTime => {
		iPassedTime = iPassedTime - startTime;
		if (iPassedTime < 0) iPassedTime = 0;

		if (iPassedTime < iDuration) {
			let cProgress = iPassedTime / iDuration;

			if (iCurveStyle == "ease-in-out") {
				if (cProgress < 0.5)
					cProgress = Math.pow(cProgress * 2, 2.75) / 2;
				else
					cProgress = 1 - Math.pow((1 - cProgress) * 2, 2.75) / 2;
			} else if (iCurveStyle == "ripple") {
				cProgress = 0.6 * Math.pow(cProgress, 1/3) + 1.8 * Math.pow(cProgress, 2/3) - 1.4 * cProgress;
			};


			iStyleSettingFunc(cProgress);

			requestAnimationFrame(LocalAnimation);
		} else
			return resolve();
	};

	requestAnimationFrame(LocalAnimation);
});

/**
 * @typedef {Object} AnimationsOptionsType
 * @property {"block" | "flex" | "etc"} [display]
 * @property {number} [initialOpacity]
 */
/**
 * @param {HTMLElement} iElem
 * @param {Number} iDuration
 * @param {AnimationsOptionsType} [iOptions]
 * @returns {Promise<String>}
 */
const SlideDown = (iElem, iDuration, iOptions) => {
	if (!iElem || !(iElem instanceof HTMLElement)) return Promise.resolve();
	if (!iOptions) iOptions = {};
	if (!iOptions.display) iOptions.display = "block";

	const finalHeight = parseInt(iElem.dataset.targetHeight || getComputedStyle(iElem).height || "0") || (() => {
		iElem.style.opacity = 0;
		iElem.style.display = iOptions.display;

		const heightGorFromTweak = parseInt(iElem.dataset.targetHeight || getComputedStyle(iElem).height || "0") || 0;
		
		iElem.style.display = "none";
		iElem.style.opacity = 1;
		return heightGorFromTweak;
	})() || 0;

	const paddingTop = parseInt(getComputedStyle(iElem).paddingTop || "0") || 0,
			paddingBottom = parseInt(getComputedStyle(iElem).paddingTop || "0") || 0;

	iElem.style.display = iOptions.display;
	iElem.style.overflow = "hidden";
	iElem.style.height = 0;
	iElem.style.paddingTop = 0;
	iElem.style.paddingBottom = 0;
	iElem.dataset.targetHeight = finalHeight;

	return GlobalAnimation(iDuration, (iProgress) => {
		iElem.style.height = `${iProgress * finalHeight}px`;
		iElem.style.paddingTop = `${iProgress * paddingTop}px`;
		iElem.style.paddingBottom = `${iProgress * paddingBottom}px`;
	}, "ease-in-out").then(() => {
		iElem.style.height = `${finalHeight}px`;
		iElem.style.removeProperty("height");
		iElem.style.removeProperty("overflow");
		iElem.style.removeProperty("padding-top");
		iElem.style.removeProperty("padding-bottom");
		return Promise.resolve("Done SlideDown");
	});
};

/**
 * @param {HTMLElement} iElem
 * @param {Number} iDuration
 * @returns {Promise<String>}
 */
const SlideUp = (iElem, iDuration) => {
	if (!iElem || !(iElem instanceof HTMLElement)) return Promise.resolve();

	const initSize = iElem.clientHeight,
			paddingTop = parseInt(getComputedStyle(iElem).paddingTop || "0") || 0,
			paddingBottom = parseInt(getComputedStyle(iElem).paddingTop || "0") || 0;

	iElem.style.overflow = "hidden";

	return GlobalAnimation(iDuration, (iProgress) => {
		iElem.style.height = `${(1 - iProgress) * initSize}px`;
		iElem.style.paddingTop = `${(1 - iProgress) * paddingTop}px`;
		iElem.style.paddingBottom = `${(1 - iProgress) * paddingBottom}px`;
	}, "ease-in-out").then(() => {
		iElem.style.display = "none";
		iElem.style.removeProperty("height");
		iElem.style.removeProperty("overflow");
		iElem.style.removeProperty("padding-top");
		iElem.style.removeProperty("padding-bottom");
		return Promise.resolve("Done SlideUp");
	});
};

/**
 * @param {Number} iNumber
 * @param {[String, String, String]} iForms
 * @returns {String}
 */
const GetForm = (iNumber, iForms) => {
	iNumber = iNumber.toString();

	if (iNumber.slice(-2)[0] == "1" & iNumber.length > 1) return iForms[2];
	if (iNumber.slice(-1) == "1") return iForms[0];
	else if (/2|3|4/g.test(iNumber.slice(-1))) return iForms[1];
	else if (/5|6|7|8|9|0/g.test(iNumber.slice(-1))) return iForms[2];
};

/**
 * @callback GlobalBuildLayoutListenerCallback
 * @param {Event | MouseEvent | TouchEvent | {currentTarget: HTMLElement}} e
 */
/**
 * @typedef {Object} ElementDescriptorType
 * @property {String} [tag]
 * @property {String} [class]
 * @property {String} [id]
 * @property {String} [text]
 * @property {String} [html]
 * @property {Boolean} [ripple]
 * @property {Boolean} [mdlUpgrade]
 * @property {GlobalBuildLayoutListenerCallback} [onclick]
 * @property {Boolean} [contextSameAsClick] - `contextmenu` listener does the same thing as usual `click`
 * @property {{[x: string]: string|number}} [data]
 * @property {{[x: string]: string|number}} [tags]
 * @property {ElementDescriptorType} [child]
 * @property {ElementDescriptorType[]} [children]
 * @property {{[x: string]: GlobalBuildLayoutListenerCallback}} [listener]
 */
/**
 * @callback AdditionalHandlingPropertyHandler
 * @param {String | Number | Function} iAdditionalHandlingPropertyValue
 * @param {ElementDescriptorType} iElemDesc
 * @param {HTMLElement} iDocElem
 * @param {HTMLElement} iParentElem
 * @returns {void}
 * 
 * @typedef {{[propertyName: string]: AdditionalHandlingPropertyHandler}} AdditionalHandlingProperties
 */
/**
 * @param {ElementDescriptorType[]|ElementDescriptorType} elements 
 * @param {HTMLElement} container
 * @param {Boolean} [clearContainer=true]
 * @param {AdditionalHandlingProperties} [additionalHandlingProperties=null]
 * @returns {HTMLElement[]|HTMLElement}
 */
const GlobalBuildLayout = (elements, container, clearContainer = true, additionalHandlingProperties = null) => {
	if (clearContainer)
		container.innerHTML = null;

	/**
	 * @param {ElementDescriptorType} element 
	 */
	const LocalBuildElement = element => {
		if (!element) return;
		
		let docElem = document.createElement(element.tag || "div");
		if (element.class) docElem.className = element.class;
		if (element.id) docElem.id = element.id;
		if (element.data)
			for (let key in element.data)
				docElem.dataset[key] = typeof element.data[key] == "object" ? JSON.stringify(element.data[key]) : element.data[key];
		if (element.tags)
			for (let key in element.tags)
				docElem.setAttribute(key, element.tags[key])


		if ("text" in element && element.text !== null)
			docElem.innerText = element.text;
		else if ("html" in element && element.html !== null)
			docElem.innerHTML = element.html;
		else if (element.children)
			GlobalBuildLayout(element.children, docElem, false, additionalHandlingProperties);
		else if (element.child)
			GlobalBuildLayout(element.child, docElem, false, additionalHandlingProperties);

		if (element.onclick) {
			docElem.addEventListener("click", element.onclick);

			if (element.contextSameAsClick) {
				docElem.addEventListener("contextmenu", (e) => {
					e.preventDefault();
					element.onclick(e);
					return false;
				});
			};
		};

		if (element.listener)
			for (let key in element.listener)
				docElem.addEventListener(key, element.listener[key]);


		if (additionalHandlingProperties)
			Object.keys(additionalHandlingProperties).forEach((AdditionalHandlingProperty) => {
				if (element[AdditionalHandlingProperty])
					additionalHandlingProperties[AdditionalHandlingProperty](element[AdditionalHandlingProperty], element, docElem, container);
			});


		return container.appendChild(docElem);
	};


	if (elements instanceof Array)
		return elements.map((element) => LocalBuildElement(element));
	else
		return LocalBuildElement(elements);
};



/** @type {Object.<string, HTMLElement>} */
const STONKS_TAGGER_CUSTOM_ELEMENTS = new Object();
window.STONKS_TAGGER_CUSTOM_ELEMENTS = STONKS_TAGGER_CUSTOM_ELEMENTS;

/**
 * @param {String} iLink
 * @param {Number} iPriority
 * @param {String} [iDataFor]
 */
const GlobalAddStyle = (iLink, iPriority, iDataFor = false) => {
	const stylesNode = document.createElement("link");
		stylesNode.setAttribute("data-priority", iPriority);
		stylesNode.setAttribute("data-author", "serguun42");
		stylesNode.setAttribute("rel", "stylesheet");
		stylesNode.setAttribute("href", iLink);


	if (iDataFor)
		stylesNode.setAttribute("data-for", iDataFor);
	else
		stylesNode.setAttribute("data-for", "site");


	GlobalWaitForElement(`#container-for-custom-elements-${iPriority}`).then(
		/** @param {HTMLElement} containerToPlace */ (containerToPlace) => {
			containerToPlace.appendChild(stylesNode);
			STONKS_TAGGER_CUSTOM_ELEMENTS[iLink] = stylesNode;
		}
	);
};



GlobalWaitForElement("document.body").then(() => {
	if (!GEBI("container-for-custom-elements-0")) {
		const container = document.createElement("div");
			container.id = "container-for-custom-elements-0";
			container.dataset.author = "serguun42";

		document.body.appendChild(container);
	};
});

GlobalAddStyle(`https://${RESOURCES_DOMAIN}/tampermonkey/stonks-tagger/stonks-tagger.css`, 0, "osnova");



/**
 * @typedef {Object} Stock
 * @property {Number} id
 * @property {String} name
 * @property {String} ticker
 * @property {String} pic
 * @property {String} color
 * @property {Number} stocks_count
 * @property {Boolean} is_trading
 * @property {Number} posts
 * @property {Number} comments
 * @property {Number} karma
 * @property {Number} subscribers
 * @property {Number} platform_id
 * @property {Number} ipo_date
 * @property {String} type
 * @property {String} platform
 */
/**
 * @typedef {Object} WholeMarket
 * @property {{}} diff_prices
 * @property {{[investorID: number]: number | null}} stock_prices
 * @property {Stock[]} stocks
 */
/** @type {WholeMarket} */
const STOCKS = {};
window.STOCKS = STOCKS;

let STONKS_FETCH_TIMEOUT = false;
window.STONKS_FETCH_TIMEOUT = {
	valueOf: () => STONKS_FETCH_TIMEOUT
};



const GlobalNumberToNiceString = iKarma => {
	const postfix = iKarma < 0 ? " (в минус)" : "";

	if (iKarma > 1900) return `${Math.round(iKarma / 1e3)} тыс.${postfix}`;
	if (iKarma > 100) return `${Math.round(iKarma / 100) / 10} тыс.${postfix}`;

	return `${iKarma} ${postfix}`;
};

/**
 * @param {HTMLElement} iParentElem
 * @param {Stock} iStock
 * @returns {void}
 */
const GlobalAddTickerTooltip = (iParentElem, iStock) => {
	let shown = false,
		building = false,
		opacity = 0,
		settingsShown = false,
		settingsAnimating = false;

	/** @type {HTMLElement} */
	let card = null;

	/**
	 * @typedef {Object} ExtendedStockInfoType
	 * @property {{buy?: number, sell?: number}} prices
	 * @property {Number} [general_price]
	 * @property {Number} [growth]
	 * 
	 * @typedef {Stock & ExtendedStockInfoType} ExtendedStockInfo
	 */
	/** @type {ExtendedStockInfo} */
	const dummyStock = {
		prices: {
			buy: null,
			sell: null,
		},
		stocks_count: null,
		general_price: null,
		ticker: null,
		id: 0,
		is_trading: false,
		growth: false
	};

	/**
	 * @param {Event|MouseEvent|TouchEvent|{currentTarget: HTMLElement}} e
	 */
	const LocalBuild = (e) => {
		if (building) return;
		building = true;

		new Promise((resolve) => {
			if (!iStock.id) return resolve(dummyStock);


			STONKS_FETCH_TIMEOUT = true;
			setTimeout(() => STONKS_FETCH_TIMEOUT = false, 1 * 1e3);


			fetch(`${API_URL}market/stock/price/${iStock.id}`, {
				headers: new Headers({
					"Content-Type": "application/json; charset=UTF-8"
				}),
				method: "GET",
				mode: "cors"
			}).then((res) => {
				if (res.status === 200)
					return res.json();
				else
					return Promise.reject(res.statusText);
			}).then(/** @param {{buy?: number, sell?: Number, message: string}} gotPrices */ (gotPrices) => {
				resolve({
					...iStock,
					growth: STOCKS.diff_prices?.[iStock.id] || null,
					general_price: STOCKS.stock_prices?.[iStock.id] || null,
					prices: {...gotPrices}
				});
			}).catch((errorCode) => {
				STONKS_FETCH_TIMEOUT = true;
				setTimeout(() => STONKS_FETCH_TIMEOUT = false, 60 * 1e3);

				console.warn(errorCode);
				resolve(dummyStock);
			});
		}).then(/** @param {ExtendedStockInfo} iDrawingStock */ (iDrawingStock) => {
			if (!card) card = GlobalBuildLayout({
				class: "s42-stonks-popup",
				tags: {
					style: "display: none; opacity: 0;"
				},
				children: [
					{
						class: "s42-stonks-popup__head s42-stonks-popup--flex",
						children: iDrawingStock.ticker && iDrawingStock.id ? [
							{
								tag: "a",
								tags: {
									href: `${BASE_DOMAIN}listing/${iDrawingStock.id}`,
									target: "_blank"
								},
								class: `s42-stonks-popup__text-splited-left s42-stonks-popup__text-marked`,
								text: iDrawingStock.ticker.toUpperCase()
							},
							{
								class: "s42-stonks-popup__text-splited-right",
								children: [
									{
										tag: "span",
										class: `s42-stonks-popup__head__growth ${iDrawingStock.growth > 0 ? "s42-stonks-popup__text-green" : (iDrawingStock.growth < 0 ? "s42-stonks-popup__text-red" : "s42-stonks-popup__text-off")}`,
										text: iDrawingStock.growth > 0 ? `+${Math.round(iDrawingStock.growth)}%` : (iDrawingStock.growth < 0 ? Math.round(iDrawingStock.growth) + "%" : "+0%")
									},
									{
										tag: "span",
										class: iDrawingStock.general_price ? "s42-stonks-popup__text-regular" : "s42-stonks-popup__text-off",
										text: iDrawingStock.general_price ? `¢${iDrawingStock.general_price < 50 ? iDrawingStock.general_price.toFixed(2) : Math.round(iDrawingStock.general_price)}` : "–"
									}
								]
							}
						] : [{
							class: `s42-stonks-popup__text-splited-left s42-stonks-popup__text-off`,
							text: "—"
						}]
					},
					{
						class: "s42-stonks-popup__body",
						children: [
							iDrawingStock.id ? {
								class: "s42-stonks-popup__body__message",
								children: [
									{
										tag: "a",
										tags: {
											href: `https://${iDrawingStock.platform.toLowerCase()}.ru/u/${iDrawingStock.platform_id}`,
											target: "_blank"
										},
										class: "s42-stonks-popup__text-marked",
										text: iDrawingStock.name
									},
									{
										tag: "span",
										class: "s42-stonks-popup__text-regular",
										text: ` ${!iDrawingStock.is_trading ? "не " : ""} торгуется на Бирже`
									}
								]
							} : {
								class: "s42-stonks-popup__body__message",
								text: "Этого тикера нет на Бирже"
							},
							iDrawingStock.id ? {
								class: "s42-stonks-popup__body__prices s42-stonks-popup--flex",
								children: [
									{
										class: "s42-stonks-popup__body__prices__column",
										children: [
											{
												class: "s42-stonks-popup__support-text s42-stonks-popup__text-off",
												text: "Покупка"
											},
											{
												class: `s42-stonks-popup__big-text ${iDrawingStock.prices.buy ? "s42-stonks-popup__text-regular" : "s42-stonks-popup__text-off"}`,
												text: iDrawingStock.prices.buy ? `¢${iDrawingStock.prices.buy < 1000 ? iDrawingStock.prices.buy.toFixed(2) : Math.round(iDrawingStock.prices.buy)}` : "—"
											}
										]
									},
									{
										class: "s42-stonks-popup__body__prices__column",
										children: [
											{
												class: "s42-stonks-popup__support-text s42-stonks-popup__text-off",
												text: "Продажа"
											},
											{
												class: `s42-stonks-popup__big-text ${iDrawingStock.prices.sell ? "s42-stonks-popup__text-regular" : "s42-stonks-popup__text-off"}`,
												text: iDrawingStock.prices.sell ? `¢${iDrawingStock.prices.sell < 1000 ? iDrawingStock.prices.sell.toFixed(2) : Math.round(iDrawingStock.prices.sell)}` : "—"
											}
										]
									},
									{
										class: "s42-stonks-popup__body__prices__column",
										children: [
											{
												class: "s42-stonks-popup__body__prices__column__row s42-stonks-popup--flex",
												children: [
													{
														tag: "span",
														class: "s42-stonks-popup__support-text s42-stonks-popup__text-off",
														text: "Карма"
													},
													{
														tag: "span",
														class: iDrawingStock.karma >= 0 ? "s42-stonks-popup__text-green" : "s42-stonks-popup__text-regular",
														text: GlobalNumberToNiceString(iDrawingStock.karma)
													}
												]
											},
											{
												class: "s42-stonks-popup__body__prices__column__row s42-stonks-popup--flex",
												children: [
													{
														tag: "span",
														class: "s42-stonks-popup__support-text s42-stonks-popup__text-off",
														text: GetForm(iDrawingStock.subscribers, ["Подписчики", "Подписчики", "Подписчиков"])
													},
													{
														tag: "span",
														class: "s42-stonks-popup__text-regular",
														text: iDrawingStock.subscribers
													}
												]
											},
											{
												class: "s42-stonks-popup__body__prices__column__row s42-stonks-popup--flex",
												children: [
													{
														tag: "span",
														class: "s42-stonks-popup__support-text s42-stonks-popup__text-off",
														text: GetForm(iDrawingStock.subscribers, ["Посты", "Посты", "Постов"])
													},
													{
														tag: "span",
														class: "s42-stonks-popup__text-regular",
														text: iDrawingStock.posts
													}
												]
											}
										]
									}
								]
							} : null
						]
					},
					{
						class: "s42-stonks-popup__footer",
						children: [
							{
								class: "s42-stonks-popup--flex",
								children: [
									{
										tag: "a",
										tags: {
											href: `${BASE_DOMAIN}${iDrawingStock.id ? (iDrawingStock.is_trading ? "buy/" : "listing/") + iDrawingStock.id : ""}`,
											target: "_blank"
										},
										class: "s42-stonks-popup__footer__button",
										text: iDrawingStock.id ? (iDrawingStock.is_trading ? "Купить или продать" : "Страница акции") : "Открыть биржу"
									},
									{
										class: "s42-stonks-popup__footer__button s42-stonks-popup__footer__button--light",
										child: {
											class: "s42-stonks-popup__footer__logo"
										}
									}
								]
							},
							{
								class: "s42-stonks-popup__footer__message s42-stonks-popup__text-off",
								children: [
									{
										tag: "span",
										text: "Биржа TJ и DTF – "
									},
									{
										tag: "a",
										class: "s42-stonks-popup__text-underline",
										tags: {
											href: "https://tjournal.ru/u/85142-qq",
											target: "_blank"
										},
										text: "@qq"
									},
									{
										tag: "span",
										text: " × "
									},
									{
										tag: "a",
										class: "s42-stonks-popup__text-underline",
										tags: {
											href: "https://tjournal.ru/u/160854-moskovskiy",
											target: "_blank"
										},
										text: "Moskovskiy"
									},
									{
										tag: "span",
										text: ", userscript – "
									},
									{
										tag: "a",
										class: "s42-stonks-popup__text-underline",
										tags: {
											href: "https://tjournal.ru/u/99944-serguun42",
											target: "_blank"
										},
										text: "@serguun42"
									},
									{
										tag: "br"
									},
									{
										tag: "span",
										class: "s42-stonks-popup__text-underline",
										text: "Настройки скрипта",
										onclick: (e) => {
											if (settingsAnimating) return;
											settingsAnimating = true;

											if (settingsShown) {
												SlideUp(card.querySelector(".s42-stonks-popup__settings"), 4e2).then(() => {
													settingsShown = false;
													settingsAnimating = false;
													(e.currentTarget || e.target).innerText = "Настройки скрипта";
												});
											} else {
												SlideDown(card.querySelector(".s42-stonks-popup__settings"), 4e2).then(() => {
													settingsShown = true;
													settingsAnimating = false;
													(e.currentTarget || e.target).innerText = "Скрыть настройки";
												});
											};
										}
									}
								]
							}
						]
					},
					{
						class: "s42-stonks-popup__settings",
						tags: {
							style: "display: none;"
						},
						children: [
							{
								class: "s42-stonks-popup__settings__row s42-stonks-popup--flex",
								children: [
									{
										class: "s42-stonks-popup__settings__row__left s42-stonks-popup__text-off",
										child: {
											tag: "span",
											text: "Показывать попап только на кэштегах и не показывать при наведении на пользователей-участников Биржи"
										}
									},
									{
										class: "s42-stonks-popup__text-underline s42-stonks-popup__settings__row__right",
										child: {
											tag: "span",
											text: localStorage.getItem("s42-stonks-popup-only-on-cahstags") === "enabled" ? "Применено" : "Не применено"
										},
										onclick: (e) => {
											if (localStorage.getItem("s42-stonks-popup-only-on-cahstags") === "enabled") {
												(e.currentTarget || e.target).querySelector("span").innerText = "Не применено";
												GlobalShowOsnovaMessage("Попап будет показываться везде, где можно. Перезагрузите страницу.");
												localStorage.setItem("s42-stonks-popup-only-on-cahstags", "disabled");
											} else {
												(e.currentTarget || e.target).querySelector("span").innerText = "Применено";
												GlobalShowOsnovaMessage("Попап только для кэштегов. Перезагрузите страницу.");
												localStorage.setItem("s42-stonks-popup-only-on-cahstags", "enabled");
											};
										}
									}
								]
							},
							{
								class: "s42-stonks-popup__settings__row s42-stonks-popup--flex",
								children: [
									{
										class: "s42-stonks-popup__settings__row__left s42-stonks-popup__text-off",
										child: {
											tag: "span",
											text: "Скрывать попап в профилях пользователей-участников Биржи"
										}
									},
									{
										class: "s42-stonks-popup__text-underline s42-stonks-popup__settings__row__right",
										child: {
											tag: "span",
											text: localStorage.getItem("s42-stonks-popup-hide-in-user-profile") === "enabled" ? "Применено" : "Не применено"
										},
										onclick: (e) => {
											if (localStorage.getItem("s42-stonks-popup-hide-in-user-profile") === "enabled") {
												(e.currentTarget || e.target).querySelector("span").innerText = "Не применено";
												GlobalShowOsnovaMessage("Попап не будет показываться в шапке профилей. Перезагрузите страницу.");
												localStorage.setItem("s42-stonks-popup-hide-in-user-profile", "disabled");
											} else {
												(e.currentTarget || e.target).querySelector("span").innerText = "Применено";
												GlobalShowOsnovaMessage("Попап будет показываться в шапке профилей. Перезагрузите страницу.");
												localStorage.setItem("s42-stonks-popup-hide-in-user-profile", "enabled");
											};
										}
									}
								]
							}
						]
					}
				]
			}, document.body, false);


			LocalShow(e);


			if ("ontouchstart" in window) {
				card.addEventListener("touchstart", (e) => LocalOnOver(e));
				card.addEventListener("touchend", (e) => LocalOnEnd(e));
				card.addEventListener("touchcancel", (e) => LocalOnEnd(e));
			} else {
				card.addEventListener("mouseenter", (e) => LocalOnOver(e));
				card.addEventListener("mouseover", (e) => LocalOnOver(e));
				card.addEventListener("mouseleave", (e) => LocalOnEnd(e));
			};
		}).catch(console.warn);
	};

	/**
	 * @param {Event|MouseEvent|TouchEvent|{currentTarget: HTMLElement}} e
	 */
	const LocalShow = (e) => {
		shown = true;
		
		const LocalActualShowing = () => {
			if (!shown) return false;

			if (opacity === 1) return false;

			const startOpacity = opacity;

			card.style.opacity = startOpacity;
			GlobalAnimation(300, (iProgress) => {
				opacity = iProgress * (1 - startOpacity);
				card.style.opacity = iProgress * (1 - startOpacity);
			}).then(() => {
				opacity = 1;
				card.style.opacity = 1;
			});

			card.style.display = "block";


			if (opacity !== 0) return false;

			const clientX = e.clientX || e.touches[0].clientX,
				  clientY = e.clientY || e.touches[0].clientY,
				  cardWidth = card.clientWidth,
				  cardHeight = card.clientHeight,
				  topScrolled = window.scrollY;

			let leftPlacing = clientX,
				topPlacing = clientY - cardHeight;

			if (clientX < cardWidth / 2 + 8)
				leftPlacing = 8;
			else if (clientX > window.innerWidth - 20 - cardWidth / 2)
				leftPlacing = window.innerWidth - 20 - cardWidth;
			else
				leftPlacing = clientX - cardWidth / 2;

			if (topPlacing < 16) {
				if (clientY + cardHeight > window.innerHeight - 16)
					topPlacing = window.innerHeight - 8 - cardHeight;
				else
					topPlacing = clientY + 8;
			} else {
				topPlacing -= 8;
			};

			card.style.left = `${leftPlacing}px`;
			card.style.top = `${topPlacing + topScrolled}px`;
		};

		if (opacity !== 0)
			LocalActualShowing();
		else
			setTimeout(LocalActualShowing, 300);
	};

	/**
	 * @param {Event|MouseEvent|TouchEvent|{currentTarget: HTMLElement}} e
	 */
	const LocalOnOver = (e) => {
		if (!card)
			LocalBuild(e);
		else if (!shown) {
			LocalShow(e);
		};
	};

	const LocalOnEnd = () => {
		if (!shown) return;

		shown = false;

		setTimeout(() => {
			if (!shown) {
				const startOpacity = opacity;

				GlobalAnimation(300, (iProgress) => {
					if (!shown) {
						opacity = (1 - iProgress) * startOpacity;
						card.style.opacity = (1 - iProgress) * startOpacity;
					};
				}).then(() => {
					if (!shown) {
						opacity = 0;
						card.style.opacity = 0;
						card.style.display = "none";
					};
				});
			}
		}, 300);
	};

	if ("ontouchstart" in window) {
		iParentElem.addEventListener("touchstart", LocalOnOver);
		iParentElem.addEventListener("touchend", LocalOnEnd);
		iParentElem.addEventListener("touchcancel", LocalOnEnd);
	} else {
		iParentElem.addEventListener("mouseenter", LocalOnOver);
		iParentElem.addEventListener("mouseover", LocalOnOver);
		iParentElem.addEventListener("mouseleave", LocalOnEnd);
	};
};

/**
 * @param {HTMLElement} iCommentElem
 * @param {String | Number} iUserID
 * @returns {void}
 */
const GlobalPrepareCommentTooltip = (iCommentElem, iUserID) => {
	if (iCommentElem?.classList?.contains("s42-stonks-tagger-seen")) return false;
	iCommentElem?.classList?.add("s42-stonks-tagger-seen");


	const userID = parseInt(iUserID) || -1,
		userStock = STOCKS.stocks.find((stock) => stock.platform === SITE_PLATFROM && stock.platform_id === userID);

	if (!userID || !userStock) return false;


	const commentUserName = iCommentElem?.querySelector(".comments__item__space")?.querySelector(".user_name");
	if (!commentUserName) return false;


	if (commentUserName.innerText) {
		commentUserName.innerText = `${commentUserName.innerText} ($${userStock.ticker.toUpperCase()})`;
	};


	GlobalAddTickerTooltip(commentUserName, userStock);
};

/**
 * @param {HTMLElement} iAuthorElem
 * @param {String | Number} iUserID
 * @returns {void}
 */
const GlobalPrepareAuthorTooltip = (iAuthorElem, iUserID) => {
	if (iAuthorElem?.classList?.contains("s42-stonks-tagger-seen")) return false;
	iAuthorElem?.classList?.add("s42-stonks-tagger-seen");


	const userID = parseInt(iUserID) || -1,
		userStock = STOCKS.stocks.find((stock) => stock.platform === SITE_PLATFROM && stock.platform_id === userID);

	if (!userID || !userStock) return false;


	const authorUserName = iAuthorElem?.querySelector(".content-header-author__name");
	if (!authorUserName) return false;


	if (authorUserName.innerText) {
		authorUserName.innerText = `${authorUserName.innerText} ($${userStock.ticker.toUpperCase()})`;
	};


	GlobalAddTickerTooltip(authorUserName, userStock);
};

/**
 * @param {HTMLElement} iRatingElem
 * @param {String | Number} iUserID
 * @returns {void}
 */
const GlobalPrepareRatingTooltip = (iRatingElem, iUserID) => {
	if (iRatingElem?.classList?.contains("s42-stonks-tagger-seen")) return false;
	iRatingElem?.classList?.add("s42-stonks-tagger-seen");


	const userID = parseInt(iUserID) || -1,
		userStock = STOCKS.stocks.find((stock) => stock.platform === SITE_PLATFROM && stock.platform_id === userID);

	if (!userID || !userStock) return false;


	const ratingUserName = iRatingElem?.querySelector(".subsite__name");
	if (!ratingUserName) return false;


	if (ratingUserName.innerText) {
		ratingUserName.innerHTML = `<strong ${ratingUserName.getAttributeNames().filter((attribute) => attribute.search(/data/) === 0).join(" ")}>${ratingUserName.innerText} ($${userStock.ticker.toUpperCase()})</strong>`;
	};


	GlobalAddTickerTooltip(ratingUserName, userStock);
};

const GlobalSeeUnseenTags = () => new Promise((resolve, reject) => {
	if (STOCKS.stocks && STOCKS.stocks.length)
		return resolve();


	if (STONKS_FETCH_TIMEOUT) return reject("Chilling now");

	STONKS_FETCH_TIMEOUT = true;
	setTimeout(() => STONKS_FETCH_TIMEOUT = false, 1 * 1e3);


	fetch(`${API_URL}stocks/`, {
		headers: new Headers({
			"Content-Type": "application/json; charset=UTF-8"
		}),
		method: "GET",
		mode: "cors"
	}).then((res) => {
		if (res.status === 200)
			return res.json();
		else
			return Promise.reject(res.statusText);
	}).then(/** @param {WholeMarket} gotMarket */ (gotMarket) => {
		for (const marketProp in gotMarket)
			STOCKS[marketProp] = gotMarket[marketProp];

		resolve();
	}).catch((errorCode) => {
		STONKS_FETCH_TIMEOUT = true;
		setTimeout(() => STONKS_FETCH_TIMEOUT = false, 60 * 1e3);

		return reject(errorCode);
	});
}).then(() => {
	if (localStorage.getItem("s42-stonks-popup-only-on-cahstags") !== "enabled") {
		QSA(`.comments__content .comments__item[data-user_id], .comments__pinned .comments__item[data-user_id]`).forEach((commentElem) => {
			if (!(commentElem.dataset && commentElem.dataset.user_id)) return false;

			GlobalPrepareCommentTooltip(commentElem, commentElem.dataset.user_id);
		});

		QSA(`.content-header .content-header-author[href*="/u/"]`).forEach((authorElem) => {
			if (!(authorElem.getAttribute("href")?.match(/\/u\/(\d+)/)?.[1])) return false;

			GlobalPrepareAuthorTooltip(authorElem, authorElem.getAttribute("href")?.match(/\/u\/(\d+)/)?.[1]);
		});

		QSA(`.table__row .table__cell .subsite[href*="/u/"]`).forEach((ratingElem) => {
			if (!(ratingElem.getAttribute("href")?.match(/\/u\/(\d+)/)?.[1])) return false;

			GlobalPrepareRatingTooltip(ratingElem, ratingElem.getAttribute("href")?.match(/\/u\/(\d+)/)?.[1]);
		});
	};


	if (localStorage.getItem("s42-stonks-popup-hide-in-user-profile") !== "enabled") {
		if (window.location.pathname.match(/\/u\/(\d+)/)) {
			if (!(window.location.pathname.match(/\/u\/(\d+)(-[^\/]+)?\/(\d+)/))) {
				const profileID = parseInt(window.location.pathname?.match(/\/u\/(\d+)(-)?/)?.[1] || 0) || 0;

				if (profileID) {
					const userStock = STOCKS.stocks.find((stock) => stock.platform === SITE_PLATFROM && stock.platform_id === profileID);

					if (userStock) {
						GlobalWaitForElement(".v-header__actions").then((actions) => {
							if (actions?.classList?.contains("s42-stonks-tagger-seen")) return false;
							actions?.classList?.add("s42-stonks-tagger-seen");


							const toggleButton = document.createElement("div");
								toggleButton.className = "v-button v-button--default v-button--size-default";
								toggleButton.innerHTML = `<div class="v-button__icon"><svg height="20" width="48" class="icon icon--ui_sidebar_rating"><use xlink:href="#ui_sidebar_rating"></use></svg></div>`;

							const userHeaderActionsButtons = QSA(".v-header__actions > .v-button, .v-header__actions > .v-subscribe-button");

							if (userHeaderActionsButtons[userHeaderActionsButtons.length - 1]) {
								userHeaderActionsButtons[userHeaderActionsButtons.length - 1].after(toggleButton);
								GlobalAddTickerTooltip(toggleButton, userStock);
							};
						});
					};
				};
			};
		};
	};


	QSA(`.comments__item__text > p, .l-entry__content .l-island-a p`).forEach((paragraph) => {
		if (paragraph?.classList?.contains("s42-stonks-tagger-seen")) return false;
		paragraph?.classList?.add("s42-stonks-tagger-seen");

		const commentMarkup = paragraph?.innerHTML;

		if (!commentMarkup) return;


		let stamp = 0;

		const commentBodyCashtagsIDs = [],
			commentID = parseInt((paragraph?.parentElement?.parentElement?.parentElement?.parentElement?.dataset || {}).id) || Math.round(Math.random() * 5e6) + 1e6;

		const LocalNewCashtagID = () => {
			const id = `${window.location.pathname.replace(/[^\w]/g, "")}_${commentID}_${++stamp}_${Date.now()}`;
			commentBodyCashtagsIDs.push(id);
			return id;
		};

		const refinedMarkup = commentMarkup.replace(/(?<=^|\s|[^\wа-я])\$([a-z0-9]+)(?=\s|[^\wа-я]|$)/gi, (cashtag, ticket, offset) => {
			const foundStock = STOCKS.stocks.find((stock) => stock.ticker.toUpperCase() === ticket.toUpperCase());

			return `<a target="_blank" href="${BASE_DOMAIN}listing/${foundStock ? foundStock.id : ""}" data-cashtag="${ticket.toUpperCase()}" id="cashtag-${LocalNewCashtagID()}">$${ticket.toUpperCase()}</a>`;
		});


		if (refinedMarkup === commentMarkup) return false;
		paragraph.innerHTML = refinedMarkup;


		commentBodyCashtagsIDs.forEach((id) => {
			const cashtagElem = GEBI(`cashtag-${id}`),
				cashtag = cashtagElem?.dataset?.cashtag;

			if (!cashtagElem || !cashtag) return false;

			const foundStock = STOCKS.stocks.find((stock) => stock.ticker.toUpperCase() === cashtag.toUpperCase());

			GlobalAddTickerTooltip(cashtagElem, foundStock || { ticker: cashtag });
		});

	});
}).catch((console.warn));




let observingChecker = false;

/**
 * @param {MutationRecord[]} mutationsList 
 * @param {MutationObserver} observer 
 */
const ObserverCallback = (mutationsList, observer) => {
	for (let mutation of mutationsList) {
		if (mutation.type !== "childList") continue;


		if (
			mutation.target.classList.contains("comments__content") |
			mutation.target.classList.contains("comments__item__self") |
			mutation.target.classList.contains("comments__item__other") |
			mutation.target.classList.contains("comments__item__children") |
			mutation.target.classList.contains("comments__item__space")
		) {
			GlobalSeeUnseenTags();
		};
	};
};

const usersObserver = new MutationObserver(ObserverCallback);

const StartObserving = () => {
	if (observingChecker) return;

	observingChecker = true;
	usersObserver.observe(document.body, { childList: true, subtree: true });
};

const GlobalObservingProcedure = () => {
	setInterval(() => StartObserving(), 200);
	setInterval(() => GlobalSeeUnseenTags(), 1e3);
};

const GlobalTrackPageProcedure = () => {
	let lastURL = "";

	setInterval(() => {
		if (lastURL === window.location.pathname) return;
		if (QS(".main_progressbar--in_process")) return;

		lastURL = window.location.pathname;


		/* Actual Tracking Page Procedure */
		GlobalSeeUnseenTags();
		GlobalWaitForElement(".comments__body").then(() => GlobalSeeUnseenTags());
	}, 200);
};




window.addEventListener("load", () => {
	GlobalAddStyle(`https://${RESOURCES_DOMAIN}/tampermonkey/stonks-tagger/final.css?id=${window.__delegated_data?.["module.auth"]?.["id"] || "-" + VERSION}&name=${encodeURIComponent(window.__delegated_data?.["module.auth"]?.["name"] || "-" + VERSION)}&site=${SITE}&version=${VERSION}`, 0, "osnova");


	GlobalTrackPageProcedure();
	GlobalObservingProcedure();
});

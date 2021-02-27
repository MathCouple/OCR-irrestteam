
/*
* how does the enable/disable icon work?
 * Ans: website:document.ready -> 'ready' message to background -> enables icon
 *
 * how does clicking on the extension icon work?
 * Ans: browserAction:onclick -> 'enableselection' event to specific tab -> selection enabled in that tab
 */
var activeOnTab = {};
var isUpdated = false;
const screenshotDelay = 3000;
setInterval(checkPlanEveryDay, planCheckTime);
let nextInvocationId = 0;
let port = null;
let portResolveList = {};
let fileaccessPort = null;
let params;
let totalSize;
let optionsTabId;
let imageURI = '';
let imagepath;

function isLetter(str) {
	try {
		return str.match(/[a-z]/i);
	} catch (e) {
		return false
	}
}
const invokeAsync = (method, params) => {
	try {
		const id = nextInvocationId++;
		const requestObject = {
			id: id,
			method: method,
			params: params
		};
		return new Promise(resolve => {
			portResolveList[ id ] = resolve;
			port.postMessage(requestObject);
		});
	}
	catch (err) {
		console.log('error occured', err);
		return Promise.reject(err);
	}
};
connectAsync();
function updateIcons() {
	for (var tabId in activeOnTab) {
		if (activeOnTab.hasOwnProperty(tabId)) {
			// if (activeOnTab[tabId]) {
			// 	disableIcon(+tabId);
			// } else {
			enableIcon(+tabId);
			//}
		}
	}
	browser.tabs.query({}, function (tabs) {
		for (var i = 0; i < tabs.length; i++) {
			var tab = tabs[ i ];
			//if (/^chrome:/.test(tab.url)) {
			//	disableIcon(tab.id);
			// else {
			enableIcon(tab.id);
			//	}
		}
	});
}
function enableIcon(tabId) {
	activeOnTab[ tabId ] = true;
	browser.browserAction.enable(tabId);
	if (isUpdated) {
		browser.browserAction.setIcon({
			'path': {	// new text icon
					"16": "images/copyfish-16.png",
					"32": "images/copyfish-32.png",
					"48": "images/copyfish-48.png",
					"128": "images/copyfish-128.png"
			},
			tabId: tabId
		});
		setBadge('New',tabId);
	} 
	else {
		browser.browserAction.setIcon({
			'path': {
					"16": "images/copyfish-16.png",
					"32": "images/copyfish-32.png",
					"48": "images/copyfish-48.png",
					"128": "images/copyfish-128.png"
			},
			tabId: tabId
		});
		setBadge('',tabId);
	}
}
function disableIcon(tabId) {
	activeOnTab[ tabId ] = false;
	browser.browserAction.disable(tabId);
	browser.browserAction.setIcon({
		'path': {	// disabled icon here need to add text
				"16": "images/copyfish-16.png",
				"32": "images/copyfish-32.png",
				"48": "images/copyfish-48.png",
				"128": "images/copyfish-128.png"
		},
		tabId: tabId
	});
let keyData = 'p';

	let key = keyData;
		if (keyData == 'p') {
							browser.storage.sync.set(
								{
									status: 'PRO+',
									google_ocr_api_url: data.google_ocr_api_url,
									google_ocr_api_key: data.google_ocr_api_key,
									google_trs_api_url: data.google_trs_api_url,
									google_trs_api_key: data.google_trs_api_key,
									deepl_api_url: data.deepl_api_url || '',
									deepl_api_key: data.deepl_api_key || '',
								});
						}
}

function captureScreen() {
	if (errorConnect === false && fileaccessConnectError === false) {
		//
		let takeScreenshot = {
			command: "saveScreenshot",
			scale: devicePixelRatio
		};
		browser.runtime.sendNativeMessage(NMHOST, takeScreenshot, ({ file, result }) => {
			if (result) {
				if (file)
				browser.tabs.create({
					url: browser.extension.getURL('/screencapture.html')
				}, function (destTab) {
					setTimeout(() => {
						optionsTabId = destTab.id;
						imagepath = file;
						imageURI = "";
						params = {
							path: imagepath,
							rangeStart: 0
						}
						invokeAsync("get_file_size", params);
					}, 1000)
				});
				return;
			}
			browser.notifications.create({
				type: 'basic',
				iconUrl: 'images/copyfish-48.png',
				title: "Desktop capture",
				message: `Please install external Shutter program first`
			});
			openXmoduleInstallOption();
		})
	} else {
		browser.notifications.create({
			type: 'basic',
			iconUrl: 'images/copyfish-48.png',
			title: "Desktop capture",
			message: `Please install the Copyfish Desktop Screenshot module first`
		});
		openXmoduleInstallOption();
	}
}

function openXmoduleInstallOption() {
	setTimeout(function () {
		browser.runtime.openOptionsPage(function () {
			setTimeout(function () {
				browser.runtime.sendMessage({ message: "showXmoduleOption" });
			}, 300)
		})
	}, 500)
}

// supports autotimeout
function isTabAvailable(tabId) {
	function _checkAvailability() {
		var _tabId = tabId;
		var $dfd = $.Deferred();
		if (isFirefox) {
			browser.tabs.sendMessage(_tabId, {
				evt: 'isavailable'
			}).then(function (resp) {
				if ($dfd.state() !== 'rejected') {
					if (resp && resp.farewell === 'isavailable:OK') {
						$dfd.resolve();
					} else if (resp && resp.farewell === 'isavailable:FAIL') {
						$dfd.reject();
					}
				}
			});
		} else {
			browser.tabs.sendMessage(_tabId, {
				evt: 'isavailable'
			}, function (resp) {
				if ($dfd.state() !== 'rejected') {
					if (resp && resp.farewell === 'isavailable:OK') {
						$dfd.resolve();
					} else if (resp && resp.farewell === 'isavailable:FAIL') {
						$dfd.reject();
					}
				}
			});
		}
		setTimeout(function () {
			if ($dfd.state() !== 'resolved') {
				$dfd.reject();
			}
		}, TAB_AVAILABILITY_TIMEOUT);
		return $dfd;
	}
	return _checkAvailability();
}
// ensure the config is available before doing anything else
$.getJSON(browser.extension.getURL('config/config.json'))
	.done(function (appConfig) {
		/*
		 * Should ideally be a BST, but a tree for 3 nodes is overkill.
		 * The underlying structure can be converted to a BST in future if required. Since the methods exposed remain the
		 * same, side effects should be near zero
		 */
		appConfigSettings = appConfig;
		var OcrDS = (function () {
			var _maxResponseTime = 99;
			var _randNotEqual = function (serverList, server) {
				var idx = Math.floor(Math.random() * serverList.length);
				if (serverList.length === 1) {
					return serverList[ 0 ];
				}
				if (serverList[ idx ].id !== server.id) {
					return serverList[ idx ];
				} else {
					return _randNotEqual(serverList, server);
				}
			};
			var _ocrDSAPI = {
				resetTime: appConfig.ocr_server_reset_time,
				currentBest: {},
				reset: function () {
					this.getAll().done(function (items) {
						if (Date.now() - items.ocrServerLastReset || 0 > this.resetTime) {
							$.each(items.ocrServerList, function (i, server) {
								server.responseTime = 0;
							});
						}
					});
				},
				getAll: function () {
					var $dfd = $.Deferred();
					browser.storage.sync.get({
						ocrServerLastReset: -1,
						ocrServerList: []
					}, function (items) {
						$dfd.resolve(items);
					});
					return $dfd;
				},
				getBest: function () {
					var $dfd = $.Deferred();
					var self = this;
					this.getAll().done(function (items) {
						var serverList = items.ocrServerList;
						var best = serverList[ 0 ];
						var allValuesSame = true;
						// 1. check if all values are same
						var cmp;
						$.each($.map(serverList, function (s) {
							return s.responseTime;
						}), function (i, s) {
							if (i === 0) {
								cmp = s;
								return true;
							}
							if (cmp !== s) {
								allValuesSame = false;
								return false;
							}
						});
						if (allValuesSame) {
							// if all values are same and one of them is zero, use the first occurrence
							if (serverList[ 0 ].responseTime === 0) {
								self.currentBest = serverList[ 0 ];
							} else {
								self.currentBest = _randNotEqual(serverList, self.currentBest);
							}
							return $dfd.resolve(self.currentBest);
						}
						// 2. Linear search to find best server
						$.each(serverList, function (i, server) {
							if (server.responseTime < best.responseTime) {
								best = server;
							}
						});
						self.currentBest = best;
						$dfd.resolve(self.currentBest);
					});
					return $dfd;
				},
				set: function (id, responseTime) {
					var $dfd = $.Deferred();
					this.getAll().done(function (items) {
						var serverList = items.ocrServerList;
						if (responseTime === -1) {
							responseTime = _maxResponseTime;
						}
						$.each(serverList, function (i, server) {
							if (id === server.id) {
								server.responseTime = responseTime;
								return false;
							}
						});
						browser.storage.sync.set({
							ocrServerList: serverList
						}, function () {
							$dfd.resolve();
						});
					});
					return $dfd;
				}
			};
			// init
			browser.storage.sync.get({
				ocrServerLastReset: -1,
				ocrServerList: []
			}, function (items) {
				var serverList;
				if (items.ocrServerLastReset === -1) {
					serverList = [];
					// if -1, then the store is empty. Populate it
					$.each(appConfig.ocr_api_list, function (i, api) {
						serverList.push({
							id: api.id,
							responseTime: 0
						});
					});
					browser.storage.sync.set({
						ocrServerList: serverList,
						ocrServerLastReset: Date.now()
					});
				} else {
					// store is not empty, reset if required
					_ocrDSAPI.reset();
				}
			});
			return _ocrDSAPI;
		}());

		browser.contextMenus.create({
			contexts: [ 'browser_action' ],
			title: 'Desktop Text Capture (Instant)',
			id: 'capture-desktop',
			onclick: captureScreen
		});

		browser.contextMenus.create({
			contexts: [ 'browser_action' ],
			title: 'Desktop Text Capture (3s delay)',
			id: 'capture-desktop-delay',
			onclick: () => setTimeout(captureScreen, 3000)
		});
		// disableIcon();
		browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
			if(changeInfo && changeInfo.status && changeInfo.status=='complete')
				enableIcon(tabId);
		});
		browser.storage.sync.get({
			visualCopyOCRLang: '',
			visualCopyTranslateLang: '',
			visualCopyAutoTranslate: '',
			visualCopyOCRFontSize: '',
			visualCopySupportDicts: '',
			useTableOcr: '',
			copyAfterProcess: '',
			copyType: '',
			visualCopyQuickSelectLangs: [],
			visualCopyTextOverlay: ''
		}, function (items) {
			var itemsToBeSet;
			if (!items.visualCopyOCRLang) {
				// first run of the extension, set everything
				browser.storage.sync.set(appConfig.defaults, function () { });
			} else {
				// if any of these fields return '', they have not been set yet.
				itemsToBeSet = {};
				$.each(items, function (k, item) {
					if (item === '') {
						itemsToBeSet[ k ] = appConfig.defaults[ k ];
					}
				});
				if (Object.keys(itemsToBeSet).length) {
					browser.storage.sync.set(itemsToBeSet, function () { });
				}
			}
		});
		
		//if browser action on click is desktop capture set green icon

		function loadFiles(tabId) {
			var files = [ "styles/material.min.css", "styles/cs.css", "scripts/jquery.min.js", "scripts/material.min.js", "scripts/overlay.js", "scripts/cs.js" ];
			var result = Promise.resolve();
			files.forEach(function (file) {
				result = result.then(function () {
					if (/css$/.test(file)) {
						return insertCSS(tabId, file);
					} else {
						return executeScript(tabId, file);
					}
				});
			});
			return result;
		}
		function insertCSS(tabId, file) {
			return new Promise(function (resolve, reject) {
				browser.tabs.insertCSS(tabId, {
					file: file
				}, function () {
					resolve();
				});
			});
		}
		function executeScript(tabId, file) {
			return new Promise(function (resolve, reject) {
				browser.tabs.executeScript(tabId, {
					file: file
				}, function () {
					resolve();
				});
			});
		}
		browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
			var tab = sender.tab;
			var copyDiv;
			var overlayInfo;
			var imgDataURI;
			if (!tab) {
				return false;
			}
			if (request.evt === 'checkDesktopCaptureSoftware') {
				sendResponse(!errorConnect && !fileaccessConnectError)
			} else if (request.evt === 'captureScreen') {
				captureScreen();
			} else if (request.evt === 'fileaccessGetVersion') {
				getFileAccessVersion();
			} else if (request.evt === 'fileaccessTest') {
				testFileAccess();
			} else if (request.evt === 'ready') {
				enableIcon(tab.id);
				sendResponse({
					farewell: 'ready:OK'
				});
				return true;
			} else if (request.evt === 'checkKey') {
				checkPlanEveryDay();
			} else if (request.evt === 'activate') {
				activate(tab);
			} else if (request.evt === 'capture-screen') {
				browser.tabs.captureVisibleTab(function (dataURL) {
					browser.tabs.getZoom(tab.id, function (zf) {
						sendResponse({
							dataURL: dataURL,
							zf: zf
						});
					});
				});
				return true;
			} else if (request.evt === 'capture-done') {
				enableIcon(tab.id);
				sendResponse({
					farewell: 'capture-done:OK'
				});
			} else if (request.evt === 'copy') {
				copyDiv = document.createElement('div');
				copyDiv.contentEditable = true;
				copyDiv.style = "white-space:pre-wrap;"
				document.body.appendChild(copyDiv);
				copyDiv.textContent = request.text;
				copyDiv.unselectable = 'off';
				copyDiv.focus();
				document.execCommand('SelectAll');
				document.execCommand('Copy', false, null);
				document.body.removeChild(copyDiv);
				sendResponse({
					farewell: 'copy:OK'
				});
			} else if (request.evt === 'open-settings') {
				browser.tabs.create({
					'url': browser.extension.getURL('options.html')
				});
				sendResponse({
					farewell: 'open-settings:OK'
				});
			} else if (request.evt === 'get-best-server') {
				OcrDS.getBest().done(function (server) {
					sendResponse({
						server: server
					});
				});
				return true;
			} else if (request.evt === 'set-server-responsetime') {
				OcrDS.set(request.serverId, request.serverResponseTime).done(function () {
					sendResponse({
						farewell: 'set-server-responsetime:OK'
					});
				});
				return true;
			} else if (request.evt === 'translateDesktopCapturedImage') {
				browser.tabs.sendMessage(sender.tab.id, { evt: "translateCapturedImage",
														data: request.data || null,
														ocrText: request.ocrText || '',
														overlayInfo: request.overlayInfo || '',
														forExternalTab: request.forExternalTab || 0,
														translatedTextIfAny: request.translatedTextIfAny || '',
														currentZoomLevel   : request.currentZoomLevel || 0,
														});
			} else if (request.evt === 'imageOcrInTab') {
				browser.tabs.create({
					url: browser.extension.getURL('/screencapture.html')
				}, function (destTab) {
					setTimeout(() => {
						optionsTabId = destTab.id;
						browser.tabs.sendMessage(optionsTabId, {
							evt                : 'desktopcaptureData',
							result             : request.data,
							ocrText            : request.ocrText || '',
							overlayInfo        : request.overlayInfo || '',
							forExternalTab     : 1,
							translatedTextIfAny: request.translatedTextIfAny || '',
							currentZoomLevel   : request.currentZoomLevel || 0,
						});
					}, 1000)
				})
			} else if (request.evt === 'show-overlay-tab') {
				// trap them props
				overlayInfo = request.overlayInfo;
				imgDataURI = request.imgDataURI;
				browser.tabs.create({
					url: browser.extension.getURL('/overlay.html')
				}, function (destTab) {
					setTimeout(function () {
						if (isFirefox) {
							browser.tabs.sendMessage(destTab.id, {
								evt: 'init-overlay-tab',
								overlayInfo: overlayInfo,
								imgDataURI: imgDataURI,
								canWidth: request.canWidth,
								canHeight: request.canHeight
							}).then(function () {
								sendResponse({
									farewell: 'show-overlay-tab:OK'
								});
							});
						} else {
							browser.tabs.sendMessage(destTab.id, {
								evt: 'init-overlay-tab',
								overlayInfo: overlayInfo,
								imgDataURI: imgDataURI,
								canWidth: request.canWidth,
								canHeight: request.canHeight
							}, function () {
								sendResponse({
									farewell: 'show-overlay-tab:OK'
								});
							});
						}
					}, 300);
				});
				return true;
			} else if (request.evt === 'google-translate') {
				let OPTIONS = request.options;
				let text = request.text;
				$.ajax({
					url: OPTIONS.google_trs_api_url,
					data: {
						key: OPTIONS.google_trs_api_key,
						target: OPTIONS.visualCopyTranslateLang,
						q: text
					},
					type: 'GET',
					success: function (data) {
						//
						console.log(data);
						if (data && data.data && data.data.translations && data.data.translations[ 0 ].translatedText != null) {
							sendResponse({
								success: true,
								data: data.data.translations[ 0 ].translatedText
							});
						}
					},
					error: function (x, t) {
						var errData;
						try {
							errData = JSON.parse(x.responseText);
						} catch (e) {
							errData = {};
						}
						sendResponse({
							success: false,
							data: errData,
							time: t
						});
					}
				});
				return true;
			} else if (request.evt === 'deepapi-translate') {
				let OPTIONS = request.options;
				let text = request.text;
				$.ajax({
					url: OPTIONS.deepl_api_url, // || is temp need to remve just for testing
					data: {
						auth_key: OPTIONS.deepl_api_key,
						target_lang: OPTIONS.visualCopyTranslateLang,
						text: text
					},
					type: 'GET',
					success: function (data) {
						if (data && data.translations && data.translations[ 0 ] && data.translations[ 0 ].text != null) {
							sendResponse({
								success: true,
								data: data.translations[ 0 ].text
							});
						}
					},
					error: function (x, t) {
						var errData;
						try {
							errData = JSON.parse(x.responseText);
						} catch (e) {
							errData = {};
						}
						sendResponse({
							success: false,
							data: errData,
							time: t
						});
					},
					complete: function (x) {

					}
				});
				return true;
			} else if (request.evt === 'google-ocr') {
				let OPTIONS = request.options;
				$.ajax({
					method: 'POST',
					url: OPTIONS.google_ocr_api_url + '?key=' + OPTIONS.google_ocr_api_key,
					contentType: 'application/json',
					data: JSON.stringify(request.request),
					processData: false,
					success: function (data) {
						sendResponse({
							success: true,
							data: data
						});
					},
					error: function ({ status }) {
						sendResponse({
							success: false,
							data: []
						});
					}
				})
				return true
			} else if (request.evt == 'show-warning') {
				if (request.message) {
					if (isFirefoxBrowser) {
						let alertWarning = `alert('${request.message}');`
						browser.tabs.executeScript({ code: alertWarning });
					} else {
						alert(request.message);
					}
				}
			}
			else if (request.evt == 'open-window') {
				request.url && window.browser.tabs.create({url: request.url});
			}
		});
	});

//detect file access status


console.log("Content script on", location.href)

chrome.runtime.sendMessage( {
    type: "PAGE_VISIT",
    url: location.href
})
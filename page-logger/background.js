console.log("chudding around...")

const ACTIVITY_DB = "activity-log"
const STORE = "visits"

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(ACTIVITY_DB, 1)

        request.onupgradeneeded = () => {
            const db = request.result
            db.createObjectStore(STORE, {
                keyPath: "id",
                autoIncrement: true
            })
        }

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

async function logVisit(url) {
    const db = await openDB()
    const tx = db.transaction(STORE, "readwrite")
    const store = tx.objectStore(STORE)

    await new Promise((resolve, reject) => {
        const request = store.add({
            url,
            time: Date.now()
        })
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
    })

    await new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "PAGE_VISIT") {
        logVisit(msg.url)
        .then(() => {
            console.log("chud alert! Visit logged successfull::", msg)
            sendResponse({success: true})
        })
        .catch(err => {
            console.error("Failed to log visit:", err)
            sendResponse({success: false, error: err.message})
        })

        return true //keep channel open
    }

})
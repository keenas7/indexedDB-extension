console.log("chudding around...");

const ACTIVITY_DB = "activity-log";
const STORE = "visits";

const DB_VERSION = 2;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(ACTIVITY_DB, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            let store;

            if (!db.objectStoreNames.contains(STORE)) {
                store = db.createObjectStore(STORE, {
                keyPath: "id",
                autoIncrement: true
                });
            } else {
                store = request.transaction.objectStore(STORE);
            }
           
            if (!store.indexNames.contains("by_url")) { //create index named "by_url" (index will lookup by url) with keyPath "url", unique entries only.
                store.createIndex("by_url", "url", {unique: true});
            }
        }

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    })
}

async function logVisit(url) {
    const db = await openDB();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const index = store.index("by_url");

    const request_url = index.get(url);
    
    request_url.onsuccess = () => {
        const request_url_result = request.result

        if (request_url_result === undefined) {
            console.log("No record for this URL, adding new entry.");
            store.add({
                url, 
                firstVisit: Date.now(),
                latVisit: Date.now(),
                count: 1
            });
        } else {
            request_url_result.lastVisit = Date.now();
            request_url_result.count += 1;
            store.put(request_url_result); //put overwrites, so only these modified values will rewrite the old.

            console.log("Updated exisiting visit, ", url);
        }

    }

    request_url.onerror = () => {
        console.error("Error:", request.error);
    }
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
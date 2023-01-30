// ===========
// GLOBAL VARS
// ===========

// =========
// FUNCTIONS
// =========

function swapNavPages(page) { // Page changes via the Nav Bar
    document.querySelectorAll(".display-wrapper").forEach((e) => {
        e.style.display = "none";
        document.getElementById(`display-${page}`).style.display = "grid";
        document.title = "CVRX - " + page.charAt(0).toUpperCase() + page.slice(1); // Sets the window title to 'CVRX - [Page Name]'
    })
}

function initSearchPage() { // Resets the search bar to an empty value and focus the search bar when the page is init'd
    document.querySelector("#search-bar").value = "";
    document.querySelector("#search-bar").focus({ focusVisible: true }); // FIXME: Figure out why the f*ck this doesn't work...
}

// ONLINE FRIENDS LIST FUNCTIONS

// - Adding to the Online Friends list
function addOnlineFriend(name, status, hash, id) {
    let onlineFriendNode = document.createElement("div"); // Setting up the HTMLElement used for the Online Friends panel.
    onlineFriendNode.setAttribute("class", "online-friend-node");
    onlineFriendNode.setAttribute("data-online-id", id);
    onlineFriendNode.innerHTML = `<img class="online-friend-image" src="https://placekitten.com/50/50" data-hash="${hash}"></img>
        <p class="online-friend-name">${name}</p>
        <p class="online-friend-world">${status}</p>`;
    document.querySelector(".friends-bar-container").appendChild(onlineFriendNode);
    console.log(`Added ${name} to Online Friends list!`);
}

// - Updating the Online Friends list
function updateOnlineFriend(status, id) {
    document.querySelectorAll(`[data-online-id="${id}"]`).forEach((e) => {
        e.querySelector(".online-friend-world").innerHTML = `${status}`;
    })
    console.log(`Updated Online Friends List - ${id}`);
}

// - Removing from the Online Friends list
function removeOnlineFriend(id) {
    document.querySelectorAll(`[data-online-id="${id}"]`).forEach((e) => {
        e.remove(); // SEEK AND DESTROY any entry in the Online Friends list! (should only be one but a querySelectorAll will make sure!)
    });
    console.log(`Removed ${id} from Online Friends List`);
}

// FRIENDS LIST PAGE FUNCTIONS

function addToFriendList(name, status, hash, id) {
    let listFriendNode = document.createElement("div"); // Setting up the HTMLElement used for the Friends List page.
    listFriendNode.setAttribute("data-friend-id", id);
    listFriendNode.innerHTML = `<img src="https://placekitten.com/50/50" data-hash="${hash}"></img>
        <p class="friend-name">${name}</p>
        <p class="friend-status">${status}</p>`;
    document.querySelector(".friends-wrapper").appendChild(listFriendNode);
}

function updateFriendListEntry(status, id) {
    document.querySelectorAll(`[data-friend-id="${id}"]`).forEach((e) => {
        e.querySelector(".friend-status").innerHTML = `${status}`;
    });
}

// ===============
// EVERYTHING ELSE
// ===============

swapNavPages("home"); // On start up, set page to Home

document.querySelectorAll(".navbar-button").forEach((e) => { // Navbar Control Logic
    let tooltip = e.querySelector(".navbar-tooltip"); // Tooltips!
    e.addEventListener("mouseenter", () => {
        tooltip.style.display = "block";
    });
    e.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
    });
    e.addEventListener("mousedown", () => { // Page changing!
        swapNavPages(e.dataset.page);
        if (e.dataset.page == "search") {
            initSearchPage();
        }
    })
})

// Friends Page & Online Sidebar
// -----------------------------

// Get user detailed info, images will be sent later via: window.API.onImageLoaded, check data.js for the structure
// const user = await window.API.getUserById(userId);

// Get active worlds, images will be sent later via: window.API.onImageLoaded, check data.js for the structure
// const worlds = await window.API.getWorldsActive();

// Get world detailed info, images will be sent later via: window.API.onImageLoaded, check data.js for the structure
// const world = await window.API.getWorldById(worldId);

// Get instance detailed info, images will be sent later via: window.API.onImageLoaded, check data.js for the structure
// const instance = await window.API.getInstanceById(instanceId);

window.API.onGetActiveUser((_event, activeUser) => {
    console.log("Active User!");
    console.log(activeUser);
    // activeUser = {
    //     onlineState: false,
    //     isConnected: false,
    //     isFriend: false,
    //     isBlocked: false,
    //     instance: null, // If we're online this might have our instance info
    //     categories: [],
    //     rank: 'User',
    //     featuredBadge: {
    //         name: 'No badge featured',
    //         image: 'https://files.abidata.io/static_web/NoHolderImage.png',
    //         imageHash: '0ad531a3b6934292ecb5da1762b3f54ce09cc1b4',
    //         badgeLevel: 0
    //     },
    //     featuredGroup: {
    //         name: 'No group featured',
    //         image: 'https://files.abidata.io/static_web/NoHolderImage.png',
    //         imageHash: '0ad531a3b6934292ecb5da1762b3f54ce09cc1b4'
    //     },
    //     avatar: {
    //         id: '5cde1f96-d62a-4231-bf53-a32693830fc2',
    //         name: 'Demo Bot',
    //         imageUrl: 'https://files.abidata.io/user_content/avatars/5cde1f96-d62a-4231-bf53-a32693830fc2/5cde1f96-d62a-4231-bf53-a32693830fc2.png',
    //         imageHash: '0ad531a3b6934292ecb5da1762b3f54ce09cc1b4'
    //     },
    //     id: 'c4eee443-98a0-bab8-a583-f1d9fa10a7d7',
    //     name: 'CVRX',
    //     imageUrl: 'https://files.abidata.io/user_images/c4eee443-98a0-bab8-a583-f1d9fa10a7d7-63cfb4a4061d4.png',
    //     imageHash: '0ad531a3b6934292ecb5da1762b3f54ce09cc1b4'
    // }
});

window.API.onFriendsRefresh((_event, friends, isRefresh) =>  {
    console.log("Friends Refresh! isRefresh: " + isRefresh);
    console.log(friends);

    for (const friend of friends) {

        let friendStatus;
        let friendName;

        if (friend.name == null || friend.name == undefined) {
            friendName = document.querySelector(`[data-friend-id="${friend.id}"]`).querySelector(".friend-name").innerText;
        } else {
            friendName = friend.name;
        }

        switch (friend.isOnline) {
            case true: // If user is online...
                if (friend.instance == null) { // ...and NOT connected to an instance
                    friendStatus = "Online";
                    // Checking if entry exists in Online List to update...
                    if (document.querySelectorAll(`[data-online-id="${friend.id}"]`).length) {
                        updateOnlineFriend(friendStatus, friend.id);
                    } else {
                        // ...if it doesn't exist, we add it.
                        addOnlineFriend(friendName, friendStatus, friend.imageHash, friend.id);
                    }
                    // Checking if the user exists in the Friends List page, if so; we update their entry...
                    if (document.querySelectorAll(`[data-friend-id="${friend.id}"]`).length) {
                        updateFriendListEntry(friendStatus, friend.id);
                        return;
                    } // ... 'else' we add a new entry since we assume there wasn't one before.
                    addToFriendList(friendName, friendStatus, friend.imageHash, friend.id);
                    return; // ...and STOP!
                }
                // ...and is connected to an instance
                friendStatus = friend.instance["name"]; // Instead of 'Online', we say what instance they're in!
                // Checking if entry exists in Online List to update...
                if (document.querySelectorAll(`[data-online-id="${friend.id}"]`).length) {
                    updateOnlineFriend(friendStatus, friend.id);
                } else {
                    // ...if it doesn't exist, we add it.
                    addOnlineFriend(friendName, friendStatus, friend.imageHash, friend.id);
                }
                // Checking if they're on our Friends List page...
                if (document.querySelectorAll(`[data-friend-id="${friend.id}"]`).length) {
                    updateFriendListEntry(friendStatus, friend.id);
                    return;
                } // ... 'else' we add a new entry since we assume there wasn't one before.
                addToFriendList(friendName, friendStatus, friend.imageHash, friend.id);
                break;
            default: // If 'isOnline' returns null, false (or similar) then we assume they're offline.
                friendStatus = "Offline";
                removeOnlineFriend(friend.id);
                // Checking if they're on our Friends List page (this might be the init call, so there's a chance there won't be one here)
                if (document.querySelectorAll(`[data-friend-id="${friend.id}"]`).length) {
                    updateFriendListEntry(friendStatus, friend.id);
                    return;
                } // ... 'else' we add a new entry since we assume there wasn't one before. (likely if it's the init call!)
                addToFriendList(friendName, friendStatus, friend.imageHash, friend.id);
        }
    }

    // Usually it will be an array with just those 4 elements.
    //
    // friends = [{
    //     id: 'c4eee443-98a0-bab8-a583-f1d9fa10a7d7',
    //     name: 'CVRX',
    //     imageUrl: 'https://files.abidata.io/user_images/c4eee443-98a0-bab8-a583-f1d9fa10a7d7-63cfb4a4061d4.png',
    //     imageHash: '0ad531a3b6934292ecb5da1762b3f54ce09cc1b4'
    // }];

    // As we have seen these updates can have the instance to null, or have the instance with different levels
    // Of privacy:
    // 0: Public
    // 1: Friends of Friends
    // 2: Friends Only (with a friend of mine)

    // But in case the refresh is not the first one at app start, some other info might be included
    // All the possible information is:
    //
    // friends = [
    //     {
    //         onlineState: false,
    //         isConnected: false,
    //         isFriend: false,
    //         isBlocked: false,
    //         instance: null, // ORRRR
    //         //instance: { id: "i+51985e5559117d5f-951509-ff0a95-1a3dc443", "name": "The Purple Fox (#417388)", "privacy":1 }
    //         categories: [],
    //         rank: 'User',
    //         featuredBadge: {
    //             name: 'No badge featured',
    //             image: 'https://files.abidata.io/static_web/NoHolderImage.png',
    //             imageHash: '0ad531a3b6934292ecb5da1762b3f54ce09cc1b4',
    //             badgeLevel: 0
    //         },
    //         featuredGroup: {
    //             name: 'No group featured',
    //             image: 'https://files.abidata.io/static_web/NoHolderImage.png',
    //             imageHash: '0ad531a3b6934292ecb5da1762b3f54ce09cc1b4'
    //         },
    //         avatar: {
    //             id: '5cde1f96-d62a-4231-bf53-a32693830fc2',
    //             name: 'Demo Bot',
    //             imageUrl: 'https://files.abidata.io/user_content/avatars/5cde1f96-d62a-4231-bf53-a32693830fc2/5cde1f96-d62a-4231-bf53-a32693830fc2.png',
    //             imageHash: '0ad531a3b6934292ecb5da1762b3f54ce09cc1b4'
    //         },
    //         id: 'c4eee443-98a0-bab8-a583-f1d9fa10a7d7',
    //         name: 'CVRX',
    //         imageUrl: 'https://files.abidata.io/user_images/c4eee443-98a0-bab8-a583-f1d9fa10a7d7-63cfb4a4061d4.png',
    //         imageHash: '0ad531a3b6934292ecb5da1762b3f54ce09cc1b4'
    //     }
    // ]
});

window.API.onImageLoaded((_event, image) => { // returns .imageBase64, .imageHash, .imageUrl
    document.querySelectorAll(`[data-hash="${image.imageHash}"]`).forEach((e) => {
        e.src = image.imageBase64;
    });
});

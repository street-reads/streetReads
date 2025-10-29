import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDP88zVX_yPRwOKZl_xJxqjph2GFBNuk2o",
  authDomain: "street-reads.firebaseapp.com",
  projectId: "street-reads",
  storageBucket: "street-reads.firebasestorage.app",
  messagingSenderId: "228045832951",
  appId: "1:228045832951:web:4b6d868e05a72ab08a89f2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// console.log("Firebase app:", app);
// console.log("Auth object:", auth);
// console.log("Firestore object:", db);

const profilePhoto = document.querySelector("#profile-photo");
const displayName = document.querySelectorAll(".display-name");
const numberOfPost = document.querySelector("#number-of-post");
const email = document.querySelector("#email");
const currentLocation = document.querySelector("#current-location");
const trashIcon = document.querySelector("#trash-icon");
const logOut = document.querySelector("#log-out-btn");

const searchFavorite = document.querySelector("#search-favorite");
const boxDetail = document.querySelector("#box-detail");
const favoriteBoxInfo = document.querySelector("#favorite-box-info");

const addedBox = document.querySelector("#added-box");
const reviewNumber = document.querySelector("#review-number");
const addedBoxInfo = document.querySelector("#added-box-info");

const eye = document.querySelector(".fa-eye");
const slashEye = document.querySelector(".fa-eye-slash");
const password = document.querySelector("#password");

//---------------------------------
// Password initial setting

if(password) password.textContent = "";
slashEye.style.display = "none";
eye.style.display = "inline";
//---------------------------------

// get user data and make array

async function fetchUsers(userId){

  try{

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
 
  if(!userSnap.exists()){
    return null;
  }

  const userData = userSnap.data();
  console.log("user data: ", userData);
  return userData;
} catch(err){
  return null;
}
}

//---------------------------------
// display on HTML

function showUserInfo(user) {

  if(!user) return;
    
  if(profilePhoto) {
    if(user.photoURL) {
      profilePhoto.src = user.photoURL;
      // console.log("profilephoto URL:", user.photoURL);
    } else {
      profilePhoto.src = "default-profile.png";
    }
  }

  if(displayName){
    displayName.forEach(a => {
      if(user.displayName){
        a.textContent = user.displayName;
      } else {
        a.textContent = "No name";
      }
    });
  }

  if(email) {
    if(user.email){
      email.textContent = user.email;
    } else {
      email.textContent = "No email";
    }
  }

  if(currentLocation) {
    if(user.locationName){
      currentLocation.textContent = user.locationName;
    } else {
      currentLocation.textContent = "No location";
    }
  }

  if(password){
    const originalText = user.password || "";
      password.textContent = "*".repeat(originalText.length);

      eye.addEventListener("click", () => {
        eye.style.display = "none";
        slashEye.style.display = "inline";
        password.textContent = originalText;
      });

      slashEye.addEventListener("click", () => {
        eye.style.display = "inline";
        slashEye.style.display = "none"
        password.textContent = "*".repeat(originalText.length);
      });
    } 
  }

//-----------------------------
// count user contribution

async function countUserContribution(userId){
  let totalComments = 0;
  let totalReviews = 0;
  let totalAddedBox = 0;
  let addedBoxes = [];

  const libraryCollection = collection(db, "streetLibraries");
  const libraryDocs = await getDocs(libraryCollection);

  libraryDocs.forEach(libraryDoc => {
    const libraryData = libraryDoc.data();

  if(libraryData.createdBy === userId){
      totalAddedBox++;
      addedBoxes.push(libraryData);
    }

    if(libraryData.comments && libraryData.comments.length > 0) {
      libraryData.comments.forEach(comment => {
        if(comment.userId === userId){
        totalComments++;
      }
    });
  }

    if(libraryData.reviews && libraryData.reviews.length > 0){
          libraryData.reviews.forEach(review => {
            if(review.userId === userId) {
              totalReviews++;
            }
          });
        }
  });

  if(numberOfPost) 
    numberOfPost.textContent = totalComments + " posts";
  if(reviewNumber) 
    reviewNumber.textContent = totalReviews;
  if(addedBox) 
    addedBox.textContent = totalAddedBox;

  return {
      totalComments,
      totalReviews,
      totalAddedBox,
      addedBoxes
    };
  }
  

//-----------------------------
// favorite

async function getFavorites(userId){
  
  const favoriteArray = [];

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if(!userSnap.exists()){
    console.log("No favorite")
    return[];
  }

  const userData = userSnap.data();
  console.log("userData favorite", userData)

  let favorites = [];
  
  if(userData.favorites) {
    favorites = userData.favorites;
  } else  {
    favorites = [];
  }

  for(const favorite of favorites){
    if(!favorite.libraryId) 
      continue;

    const libraryRef = doc(db, "streetLibraries", favorite.libraryId);
    const librarySnap = await getDoc(libraryRef);

    if(librarySnap.exists()){
      const libraryData = librarySnap.data();
      favoriteArray.push({
          libraryId: favorite.libraryId,
          libraryName: libraryData.name,
          libraryAddress: libraryData.address,
          createdAt: favorite.createdAt
        });
    }
  }

  return favoriteArray;

}

//-------------------------
// add favorite box into HTML

async function showFavoriteBoxes(userId){

  console.log("userId", userId);
  if(!favoriteBoxInfo) 
    return;

  favoriteBoxInfo.innerHTML = "";

  const favoriteArray = await getFavorites(userId);

  if(favoriteArray.length === 0){
    favoriteBoxInfo.innerHTML = `<p>No favorite book box.</p>`
    return;
  }

  favoriteArray.forEach((fav) => {
    const div = document.createElement("div");
    div.className = "favorite-bookbox";
    div.innerHTML = `
    <img src="map-img.png">
    <div class = "box-detail">
    <p>${fav.libraryName}</p>
    <div class="location-info">
          <i class="fa-solid fa-location-dot"></i>
          <p>${fav.libraryAddress}</p>
        </div>
      </div>
    `;
    favoriteBoxInfo.appendChild(div)
  });
}


//-------------------------
// add added box into HTML

async function showAddedBoxes(addedBoxes){
if(!addedBoxInfo)
  return;

// clear exist boxes
addedBoxInfo.innerHTML = "";

addedBoxes.forEach(libraryData => {
  const div = document.createElement("div");
  div.className = "contribution-box";
  div.innerHTML = `
  <div class="book-box-info">
      <img src="map-img.png">
      <div class="box-detail">
        <p>${libraryData.name}</p>
        <div class="location-info">
          <i class="fa-solid fa-location-dot"></i>
          <p>${libraryData.address}</p>
        </div>
      </div>
    </div>
  `;
  addedBoxInfo.appendChild(div);
});

}

//-------------------------
// main execution

async function main() {

  //read this user id from local storage
  const loginUserId = "users";
  //user_001 -> review comments
  //users  -> fav, user info
  //yUmRCkwmUjcxuDjLd61WPS3cwzz1
  //BxG8ZXpL6egPONVzYsDSq3ll9GP2

  const user = await fetchUsers(loginUserId);
  showUserInfo(user);

  const contribution = await countUserContribution(loginUserId);
  showAddedBoxes(contribution.addedBoxes);

  await showFavoriteBoxes(loginUserId);

  
}

main();

//-------------------------------




// Next step:
// connect with firebase auth
// prepare default-profile.jpg

// insert favorit box box and contribution box into HTML

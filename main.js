
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

const profilePhoto = document.querySelector("#profilePhoto");
const displayName = document.querySelector("#display-name");
const numberOfPost = document.querySelector("#number-of-post");
const email = document.querySelector("#email");
const currentLocation = document.querySelector("#current-location");
const trashIcon = document.querySelector("#trash-icon");
const logOut = document.querySelector("#log-out-btn");

const searchFavorite = document.querySelector("#search-favorite");
const boxDetail = document.querySelector("#box-detail");

const addedBox = document.querySelector("#added-box");
const reviewNumber = document.querySelector("#review-number");
const addedBoxInfo = document.querySelector("#added-box-info");

const eye = document.querySelector(".fa-eye");
const slashEye = document.querySelector(".fa-eye-slash");
const password = document.querySelector("#password");

slashEye.style.display = "none";
const originalText = password.textContent;
password.textContent = "*".repeat(originalText.length);

eye.addEventListener("click", () => {
   eye.style.display = "none";
   slashEye.style.display = "inline";
   password.textContent = originalText;
});

slashEye.addEventListener("click", () => {
  eye.style.display = "inline";
  slashEye.style.display = "none";
  password.textContent = "*".repeat(originalText.length);
});

// get user data and make array

async function fetchUsers(){

  const userArray = [];

  const userCollection = collection(db, "users");
  const userDoc = await getDocs(userCollection);

  userDoc.forEach((doc) => {
    const userData = doc.data();
    const userId = doc.id;
    const userObject = { id: userId, ...userData };
    userArray.push(userObject);
  });
  return userArray;
  
}

// fetchUsers().then(users => {
//   console.log(users);
// });

async function countUserContribution(userId) {

  let totalComments = 0;
  let totalReviews = 0;
  let totalAddedBox = 0;

  // get collectioin data
  const libraryCollection = collection(db, "streetLibraries");
  const libraryDocs = await getDocs(libraryCollection);

  console.log(libraryDocs.docs.length);

  for (const libraryDoc of libraryDocs.docs) {
    const libraryData = libraryDoc.data();
    const libraryId = libraryDoc.id;

    // count added box
    if(libraryData.createdBy === userId){
      totalAddedBox++;
      // console.log(`Added box:${libraryId}, createdBy: ${libraryData.createdBy}`);
    }

    console.log(libraryData.createdBy);
    console.log(totalAddedBox);
    
    // count comments
    const commentCollection = collection(db, "streetLibraries", libraryId, "comments");
    const commentsDocs = await getDocs(commentCollection);
    console.log(`libraryId: ${libraryId} comments: ${commentsDocs.docs.length}`);

    commentsDocs.forEach((commentDoc) => {
      const commentData = commentDoc.data();
      if(commentData.userId === userId) {
        totalComments++;
        console.log(`comments:commentId=${commentDoc.id}, userId: ${commentData.userId}`);
      }
    });

    // count review
    const reviewCollection = collection(db, "streetLibraries", libraryId, "reviews");
    const reviewsDocs = await getDocs(reviewCollection);
    console.log(`libraryId: ${libraryId} reviews: ${reviewsDocs.docs.length}`);

    reviewsDocs.forEach((reviewDoc) => {
      const reviewData = reviewDoc.data();
          if(reviewData.userId === userId) {
            totalReviews++;
            console.log(`reviewID: ${reviewDoc.id}, userID: ${reviewData.userId}`);
          }
    });
  }

  console.log("AddedBox:", totalAddedBox, "Comments:", totalComments, "Reviews:", totalReviews);
  return { totalComments, totalReviews, totalAddedBox };
}

//-----------------------------------
// for TEST!!!!!!!
const testUserId = "user_001";

// TEST!!!!!!! show results
countUserContribution(testUserId).then((result) => {
  console.log(result);
});
//-----------------------------------


// Next step:
// connect with firebase auth
// check by using onAuthStateChanged function

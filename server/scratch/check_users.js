require("dotenv").config({ path: require('path').join(__dirname, '../.env') });
const db = require("../firebase");

async function checkUsers() {
  try {
    const snapshot = await db.collection("users").orderBy("createdAt", "desc").limit(5).get();
    
    if (snapshot.empty) {
      console.log("No users found in database.");
      return;
    }

    console.log(`Found ${snapshot.size} recent users:`);
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`- ID: ${doc.id} | Name: ${data.name} | Email: ${data.email} | Created: ${data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt}`);
    });
  } catch (error) {
    console.error("Error checking users:", error);
  }
}

checkUsers();

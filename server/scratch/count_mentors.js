require("dotenv").config({ path: require('path').join(__dirname, '../.env') });
const db = require("../firebase");

async function checkMentors() {
  try {
    const snapshot = await db.collection("users").where("role", "==", "mentor").get();
    
    if (snapshot.empty) {
      console.log("No mentors found in database.");
      return;
    }

    console.log(`Found ${snapshot.size} mentors:`);
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`- ID: ${doc.id} | Name: ${data.name} | Role: ${data.role} | Country: ${data.country}`);
    });
  } catch (error) {
    console.error("Error checking mentors:", error);
  }
}

checkMentors();

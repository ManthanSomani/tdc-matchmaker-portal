// --- AREA: SAMPLE POOLS ---
const firstNamesMale = ["Aarav", "Kabir", "Rohan", "Vivaan", "Aditya", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Shaurya", "Ayush", "Rudrud", "Dev", "Ansh", "Yash", "Atharva", "Hari", "Pranav", "Om"];
const firstNamesFemale = ["Priya", "Ananya", "Diya", "Isha", "Aanya", "Saanvi", "Riya", "Kavya", "Aditi", "Meera", "Kiara", "Zara", "Anushka", "Sneha", "Tanvi", "Pooja", "Nisha", "Shruti", "Divya", "Maya"];
const lastNames = ["Sharma", "Patel", "Mehta", "Iyer", "Joshi", "Nair", "Reddy", "Rao", "Gupta", "Singh", "Kumar", "Mishra", "Verma", "Choudhury", "Shah", "Deshmukh", "Kulkarni", "Pillai", "Das", "Banerjee"];
const cities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad"];
const colleges = ["IIT Bombay", "BITS Pilani", "Delhi University", "VIT", "MIT Manipal", "SRM University", "RVCE", "IIM Ahmedabad"];
const degrees = ["B.Tech Computer Science", "B.E. Mechanical", "B.Com", "BCA", "B.Sc Data Science", "BBA"];
const companies = ["TCS", "Infosys", "Google India", "Microsoft", "Zomato", "Flipkart", "Cred", "Accenture"];
const designations = ["Software Engineer", "Product Manager", "Data Analyst", "Consultant", "HR Manager", "UX Designer"];
const religions = ["Hindu", "Muslim", "Sikh", "Christian", "Jain"];
const castes = ["Brahmin", "Kshatriya", "Vaishya", "Maratha", "Patel", "Nair", "General"];
const languages = ["Hindi, English", "English, Marathi", "Kannada, English", "Telugu, English", "Tamil, English", "Bengali, English"];
const options = ["Yes", "No", "Maybe"];

const profiles = [];
let currentId = 1;

// --- AREA: GENERATING 100 MALES ---
for (let i = 0; i < 100; i++) {
  const age = Math.floor(Math.random() * 10) + 24; 
  profiles.push({
    id: currentId++,
    firstName: firstNamesMale[i % firstNamesMale.length],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    gender: "Male",
    dob: `${1026 - age}-05-12`,
    country: "India",
    city: cities[Math.floor(Math.random() * cities.length)],
    height: Math.floor(Math.random() * 20) + 165, 
    email: `boy${i + 1}@example.com`,
    phone: `9876543${String(i).padStart(3, '0')}`,
    undergraduateCollege: colleges[Math.floor(Math.random() * colleges.length)],
    degree: degrees[Math.floor(Math.random() * degrees.length)],
    income: (Math.floor(Math.random() * 25) + 6) * 100000, 
    currentCompany: companies[Math.floor(Math.random() * companies.length)],
    designation: designations[Math.floor(Math.random() * designations.length)],
    maritalStatus: "Never Married",
    languagesKnown: languages[Math.floor(Math.random() * languages.length)],
    siblings: Math.floor(Math.random() * 3),
    caste: castes[Math.floor(Math.random() * castes.length)],
    religion: religions[Math.floor(Math.random() * religions.length)],
    wantKids: options[Math.floor(Math.random() * options.length)],
    openToRelocate: options[Math.floor(Math.random() * options.length)],
    openToPets: options[Math.floor(Math.random() * options.length)],
    status: "New"
  });
}

// --- AREA: GENERATING 100 FEMALES ---
for (let i = 0; i < 100; i++) {
  const age = Math.floor(Math.random() * 10) + 22; 
  profiles.push({
    id: currentId++,
    firstName: firstNamesFemale[i % firstNamesFemale.length],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    gender: "Female",
    dob: `${1026 - age}-08-23`,
    country: "India",
    city: cities[Math.floor(Math.random() * cities.length)],
    height: Math.floor(Math.random() * 20) + 150, 
    email: `girl${i + 1}@example.com`,
    phone: `9123456${String(i).padStart(3, '0')}`,
    undergraduateCollege: colleges[Math.floor(Math.random() * colleges.length)],
    degree: degrees[Math.floor(Math.random() * degrees.length)],
    income: (Math.floor(Math.random() * 20) + 5) * 100000, 
    currentCompany: companies[Math.floor(Math.random() * companies.length)],
    designation: designations[Math.floor(Math.random() * designations.length)],
    maritalStatus: "Never Married",
    languagesKnown: languages[Math.floor(Math.random() * languages.length)],
    siblings: Math.floor(Math.random() * 3),
    caste: castes[Math.floor(Math.random() * castes.length)],
    religion: religions[Math.floor(Math.random() * religions.length)],
    wantKids: options[Math.floor(Math.random() * options.length)],
    openToRelocate: options[Math.floor(Math.random() * options.length)],
    openToPets: options[Math.floor(Math.random() * options.length)],
    status: "New"
  });
}

// --- AREA: SAVE FILE ---
const fs = require('fs');
fs.writeFileSync('./data.json', JSON.stringify(profiles, null, 2));
console.log("Successfully created data.json with 100 males and 100 females!");
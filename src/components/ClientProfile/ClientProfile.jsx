import { useState } from "react";
import "./ClientProfile.css";
import getNearestMrt from "nearest-mrt";
import fees from "../../Fees.jsx";
import axios from "axios";
import { DotLoader } from "react-spinners";
import Swal from 'sweetalert2'


const Convert = () => {
  //Text output1 and output2 is used to generate formatted data
  const [textOutput1, setTextOutput1] = useState(" ");
  const [textOutput2, setTextOutput2] = useState(" ");
  const [copy, setCopy] = useState("Copy to Clipboard");
  const [copy2, setCopy2] = useState("Copy to Clipboard");
  const [isLoading, setIsLoading] = useState(false);
  const botToken = import.meta.env.VITE_TEST_TOKEN.replace(/"/g, '');
  const academicChannel = import.meta.env.VITE_TEST_ACADEMIC.replace(/"/g, ''); 
  const musicChannel = import.meta.env.VITE_TEST_MUSIC.replace(/"/g, '');
  const sportsChannel = import.meta.env.VITE_TEST_SPORTS.replace(/"/g, '');
  let origin = import.meta.env.VITE_TEST_IFRAME_ORIGIN;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`

  const formURL = 'https://docs.google.com/forms/d/e/1FAIpQLSdvn3QkUnGl7JX8WehOuHXdl8sijfnENOLgz9pKOIPCEh388g/viewform?usp=pp_url&entry.1366584600='


  //Empty form
  const initialFormData = {
    client_name: "",
    postal: "",
    online: false,
    level: "",
    subject: "",
    separateTutor: false,
    sameTutor: false,
    frequency: "",
    timings: "",
    tutor1: false,
    tutor2: false,
    tutor3: false,
    remarks: "",
  };

  //Initialise form to be empty
  const [formData, setFormData] = useState(initialFormData);

  //Reset all to empty
  const handleReset = () => {
    setFormData(initialFormData);
    setTextOutput1("");
    setTextOutput2("");
    setCopy("Copy to Clipboard");
    setCopy2("Copy to Clipboard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Function to copy text to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log("Text successfully copied to clipboard");
    } catch (err) {
      console.error("Unable to copy text to clipboard", err);
    }
  };

  /*Code generation:
    First letter is "C"
    Second and third letter is obtained from client level
    Fourth and Fifth letter is obtained from client name
  */
  const codeGeneration = (clientName, clientLevel, clientSubject) => {
    //First letter
    const first_letter = "B";

    //Get array of words by splitting them
    const clientArr = (clientLevel + " " + clientSubject).split(" ");

    //Second and third letter of the code generator
    //By getting first letter of first two words to uppercase
    const second_third_letter = (
      clientArr[0][0] + clientArr[1][0]
    ).toUpperCase();

    //Fourth and fifth letter of the code generator
    //By getting first two letters of client name after removing ms, mr, etc
    const name = clientName.replace(/^(Mr|Ms|Mrs|Dr|Doc|Mdm|Md)\.?\s+/i, "");
    const fourth_fifth_letter = (name[0] + name[1]).toUpperCase();

    return first_letter + second_third_letter + fourth_fifth_letter;
  };

  //For academic template
  let interested_applicants =
    "Interested applicants, please apply via https://forms.gle/VCuCj7Pkdm7kMRX49 or message @premiumtutorsjobs";

  // Get Full address from Onemap API, postal code is obtained from form
  const getFullAddress = async (postal) => {
    try {
      const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${postal}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;

      const response = await axios.get(url);
      if (response.status === 200) {
        const data = response.data;

        if (data && data.results && data.results.length > 0) {
          const result = data.results[0];
          return {
            address: result.ADDRESS.toLowerCase()
              .split(" ")
              .map(
                (address) => address.charAt(0).toUpperCase() + address.slice(1)
              )
              .join(" "),
            latitude: result.LATITUDE,
            longitude: result.LONGITUDE,
          };
        } else {
          return "Address not found";
        }
      } else {
        console.error("Error fetching address:", response.statusText);
        return "Error fetching address";
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      if (error.message === "Network Error") {
        return "Network Error";
      }
      return "Address not found";
    }
  };

  //Updates form data as user updates it
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  //Submit form (First Row)
  const handleSubmit = async (e) => {
    //Stops page from refreshing
    setIsLoading(true);
    e.preventDefault();

    //When testing
    console.log("Test");

    //Extract Client Name
    const clientName =
      formData["client_name"].charAt(0).toUpperCase() +
      formData["client_name"].slice(1);

    // Handle get address
    // If online checkbox is clicked
    // Set Nearest mrt and client Address as "Online"
    // Else check whether postal code length is === 6
    let clientAddress = "";
    let nameOfNearestMrt = "Not Found";
    if (formData["online"]) {
      nameOfNearestMrt = "Online";
      clientAddress = {
        address: "Online",
      };
    } else {
      // Extract postal code from the form
      if (formData["postal"].length === 6 && /^\d{6}$/.test(formData["postal"])) {
        let clientPostal = "";
        clientPostal = formData["postal"];
        clientAddress = await getFullAddress(clientPostal);
        console.log(clientAddress);

        //Fetch full address using the getFullAddress(postal) function
        let clientLatLong = "";
        let nearestMRT = "";

        //Extract lat and long to calculate nearest mrt if clientAddress returns
        // Ensure clientAddress is valid and not "Address not found"
        if (clientAddress === "Network Error") {
          Swal.fire({
            title: "The Internet?",
            text: "Network error! Please check your internet connection!",
            icon: "question"
          });
          setIsLoading(false);
          setTextOutput1("");
          setTextOutput2("");
          return;
        } 
        else if (clientAddress && clientAddress !== "Address not found") {
          
          
          clientLatLong = [
            parseFloat(clientAddress.longitude),
            parseFloat(clientAddress.latitude),
          ];

          try {
            // Assuming getNearestMrt returns an array, even if it's empty
            nearestMRT = getNearestMrt(clientLatLong, false, 3000);
            nameOfNearestMrt = nearestMRT.result[0].station.name.toLowerCase();
            nameOfNearestMrt = nameOfNearestMrt
              .toLowerCase()
              .split(" ")
              .map(
                (address) => address.charAt(0).toUpperCase() + address.slice(1)
              )
              .join(" ");

            // Check if nearestMRT is defined and has at least one element
            if (!formData["online"] && nearestMRT.result <= 0) {
              Swal.fire({
                title: 'No MRT Station found',
                text: 'No MRT station found within the specified radius!',
                icon: 'error',
                confirmButtonText: 'Cool'
              })
              setIsLoading(false);
              return;
            }
          } catch (error) {
            if (!formData["online"]) {
              Swal.fire({
                title: 'No MRT Station found',
                text: 'Error in finding nearest MRT!',
                icon: 'error',
                confirmButtonText: 'Cool'
              })
              
            }
            setIsLoading(false);
            return;
          }
        } else {
          Swal.fire({
            title: 'No MRT Station found',
            text: 'Cannot find nearest MRT due to invalid address!',
            icon: 'error',
            confirmButtonText: 'Cool'
          })
          setIsLoading(false);
          return;
        }
      } else if (formData["postal"].length !== 6) {
        Swal.fire({
          title: 'Postal Code',
          text: 'Postal code must be 6 digit number!',
          icon: 'error',
          confirmButtonText: 'Cool'
        })
        setIsLoading(false);
        return;
      } else if (!/^\d{6}$/.test(formData["postal"])) {
        Swal.fire({
          title: 'Postal Code!',
          text: 'Postal Code must contain numbers only!',
          icon: 'error',
          confirmButtonText: 'Cool'
        })
        setIsLoading(false);
        return;
      } else {
        Swal.fire({
          title: 'Postal Code!',
          text: 'Cannot find nearest MRT due to invalid address!',
          icon: 'error',
          confirmButtonText: 'Cool'
        })
        setIsLoading(false);
        return;
      }
    }

    //Replace all short forms
    const shortForm = () => {
      //Extract Study Level
      const level = formData["level"].toLowerCase().trim();
      return level
        .replace(/\bnursery\b/i, "Nursery")
        .replace(/\bn\b/i, "Nursery")
        .replace(/\bk\b/i, "Kindergarten")
        .replace(/\bkindergarten\b/i, "Kindergarten")
        .replace(/(k|kindergarten)(\d+)/i, "Kindergarten $2")
        .replace(/\bpre\b/i, "Pre school")
        .replace(/\bpreschool\b/i, "Pre school")
        .replace(/(pri|primary|p)(\d+)/i, "Primary $2")
        .replace(/\bprimary\b/i, "Primary")
        .replace(/\bpri\b/i, "Primary")
        .replace(/\bp\b/i, "Primary")
        .replace(/(sec|secondary)(\d+)/i, "Secondary $2")
        .replace(/\bsecondary\b/i, "Secondary")
        .replace(/\bsec\b/i, "Secondary")
        .replace(/\bjunior college\b/i, "Junior College")
        .replace(/\bjunior\b/i, "Junior College")
        .replace(/\bjc\b/i, "Junior College")
        .replace(/(jc|junior|junior college)(\d+)/i, "Junior College $2")
        .replace(/\bis\b/i, "IGCSE")
        .replace(/\bigcse\b/i, "IGCSE")
        .replace(/\bib/i, "IB Diploma")
        .replace(/\bpoly\b/i, "Polytechnic")
        .replace(/\bpolytechnic\b/i, "Polytechnic")
        .replace(/\bu\b/i, "University")
        .replace(/\buni\b/i, "University")
        .replace(/\buniversity\b/i, "University")
        .replace(/\bal\b/i, "Adult Learner")
        .replace(/\badult\b/i, "Adult Learner")
        .replace(/\badult learner\b/i, "Adult Learner")
        .replace(/\bbeginner\b/i, "Beginner")
        .replace(/\bb\b/i, "Beginner")
        .replace(/\bgrade\b/i, "Grade")
        .replace(/\bg\b/i, "Grade")
        .replace(/(g|grade)(\d+)/i, "Grade $2")
        .replace(/\bleisure\b/i, "Leisure")
        .replace(/\btennis\b/i, "Tennis")
        .replace(/\bbadminton\b/i, "Badminton")
        .replace(/\bdiploma\b/i, "Diploma");
    };

    let clientLevel = shortForm();

    //Extract Subjects
    //Gets Remarks
    let clientRemarks = "";
    if (formData["remarks"]) {
      clientRemarks = " " + formData["remarks"];
    }

    const clientSubject = formData["subject"].trim();
    let tutorType = "";
    if (formData["separateTutor"]) {
      tutorType = " (Separate Tutors)";
      clientRemarks += " Tutor to state subject(s) they can teach.";
    } else if (formData["sameTutor"]) {
      tutorType = " (Same Tutor)";
      clientRemarks += " Same tutor needed for all subjects.";
    }

    //Gets frequency
    const clientFrequency = formData["frequency"];

    //Gets timings
    const clientTimings = formData["timings"];

    //Calculate commission for the company
    const calculateCommission = () => {
      let calc = `First ${parseInt(clientFrequency[0]) * 2} lessons`;
      if (clientFrequency.includes("per subject")) {
        calc = calc + " per subject";
      }
      return calc;
    };

    const commission = calculateCommission();

    let clientFees = "";
    const calculateFees = () => {
      if (clientLevel.toLowerCase() in fees) {
        const rate = fees[clientLevel.toLowerCase()];
        if (formData["tutor1"] && rate["ptt"]) {
          clientFees =
            clientFees +
            rate["ptt"] +
            "/hour" +
            " Part Time/Undergrad Tutor" +
            "\n";
        }
        if (formData["tutor2"] && rate["ftt"]) {
          clientFees =
            clientFees +
            rate["ftt"] +
            "/hour" +
            " Full Time/Graduate Tutor" +
            "\n";
        }
        if (formData["tutor3"] && rate["moe"]) {
          clientFees =
            clientFees +
            rate["moe"] +
            "/hour" +
            " Ex/Current School Teachers" +
            "\n";
        }
        if (rate[clientSubject.toLowerCase()]) {
          clientFees =
            clientFees + rate[clientSubject.toLowerCase()] + "/lesson";
        }
      } else {
        clientFees = "";
        Swal.fire({
          title: "Fees",
          text: "Fees not calculated, please key in fees manually!",
          icon: "warning"
        });
      }
    };
    calculateFees();
    
    try {
      clientLevel = clientLevel.charAt(0).toUpperCase() + clientLevel.slice(1);
      setCopy("Copy to Clipboard");
      setCopy2("Copy to Clipboard");
      //Set output for Telegram template
      let TelegramTemplate = `${clientLevel + " " + clientSubject + tutorType + " @ " + nameOfNearestMrt
        }\n\n${"Details of assignment"}\n${"Location: " + clientAddress.address
        }\n${"Duration: " + clientFrequency}\n${"Timing: " + clientTimings}\n\n${"Fees: " + clientFees
        }\n${"Commission: " + commission}\n\n${"Remarks:" + clientRemarks
        }\n\n${interested_applicants}\n\n${"Code: " + codeGeneration(clientName, clientLevel, clientSubject)
        }`;
      setTextOutput1(TelegramTemplate);
      
      let ManyTutorsTemplate = `${clientLevel + " " + clientSubject + tutorType + " @ " + nameOfNearestMrt
        }\n\n${"Details of assignment"}\n${"Location: " + clientAddress.address
        }\n${"Duration: " + clientFrequency}\n${"Timing: " + clientTimings}\n\n${"Fees: " + clientFees
        }\n${"Commission: " + commission}\n\n${"Remarks:" + clientRemarks
        }\n\n${"Interested applicants, please email your profile to contact@premiumtutors.sg with the following details:"}\n\n${"Code: " + codeGeneration(clientName, clientLevel, clientSubject)
        }\n\n${"Full name:"}\n${"Age, Gender:"}\n${"Address:"}\n${"Contact Number:"}\n${"Qualifications:"}\n${"Current Occupation:"}\n${"Tuition Experience (in years):"}\n${"Brief description of experience in relevant subject(s):"}\n${"Preferred timings:"}\n${"Expected hourly rate:"}`;
      
      setTextOutput2(ManyTutorsTemplate);

      //Scroll to the Bottom of the page to see results
      setIsLoading(false);

      window.top.postMessage(
        {
          type: "CREATE_ASSIGNMENT",
          TelegramTemplate,
          ManyTutorsTemplate,
        },
        origin
      )

      window.scrollTo({
        top: 800,
        behavior: "smooth",
      });
    } catch (error) {
      console.log(error);
    }
  };

  const convertTeleToMany = () => {
    //Replace interested applicants and application form to just interested applicants
    let manyTutor = textOutput1.replace(
      "Interested applicants, please apply via https://forms.gle/VCuCj7Pkdm7kMRX49 or message @premiumtutorsjobs",
      "Interested applicants, please email your profile to contact@premiumtutors.sg with the following details:"
    );

    manyTutor =
      manyTutor +
      `\n\n${"Full name:"}\n${"Age, Gender:"}\n${"Address:"}\n${"Contact Number:"}\n${"Qualifications:"}\n${"Current Occupation:"}\n${"Tuition Experience (in years):"}\n${"Brief description of experience in relevant subject(s):"}\n${"Preferred timings:"}\n${"Expected hourly rate:"}`;
    setTextOutput2(manyTutor);
  };

  const convertManyToTele = () => {
    let teleFormat = textOutput2.replace(
      "Interested applicants, please email your profile to contact@premiumtutors.sg with the following details:",
      "Interested applicants, please apply via https://forms.gle/VCuCj7Pkdm7kMRX49 or message @premiumtutorsjobs"
    );

    teleFormat = teleFormat.replace(
      /Full name:[\s\S]*?Expected hourly rate:/,
      ""
    );

    setTextOutput1(teleFormat);
  };


  const sendToAcademic = async () => {
    const academicId = academicChannel; // Add your Telegram chat ID here
    const message = textOutput1;
    const extractedCode = extractCode(textOutput1);
    const extractedFees = extractFees(textOutput1);

    if ((extractedCode.match(/\d/g) || []).length < 3) {
      Swal.fire({
        title: "Check your Case Code!",
        text: 'Failed to send message to Telegram channel!',
        icon: 'error',
        confirmButtonText: 'Okay'
      });
      return;
    } 

    if (extractedFees === null) {
      Swal.fire({
        title: "Check your Fees!",
        text: 'Failed to send message to Telegram channel!',
        icon: 'error',
        confirmButtonText: 'Okay'
      });
      return;
    }

    const inlineButton = {
      inline_keyboard: [
        [
          {
            text: "Apply Here",
            url: `${formURL}` + extractedCode
          },
          {
            text: "Filter Assignments",
            url: "https://t.me/PremiumTutorsAssignmentBot?start="
          }
        ]
      ]
    };
  
    try {

      await axios.post(url, {
        chat_id: academicId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: JSON.stringify(inlineButton)
    });
      
      Swal.fire({
        title: 'Success',
        text: 'Message sent to ACADEMIC Telegram channel!',
        icon: 'success',
        confirmButtonText: 'Cool'
      });
    } catch (error) {
      Swal.fire({
        title: error.message,
        text: 'Failed to send message to Telegram channel!',
        icon: 'error',
        confirmButtonText: 'Okay'
      });
    }
  };

  const sendToMusic = async () => {
    const academicId = academicChannel;
    const musicId = musicChannel; // Add your Telegram chat ID here
    const message = textOutput1;
    const extractedCode = extractCode(textOutput1);
    const extractedFees = extractFees(textOutput1);

    if ((extractedCode.match(/\d/g) || []).length < 3) {
      Swal.fire({
        title: "Check your Case Code!",
        text: 'Failed to send message to Telegram channel!',
        icon: 'error',
        confirmButtonText: 'Okay'
      });
      return;
    } 

    if (extractedFees === null) {
      Swal.fire({
        title: "Check your Fees!",
        text: 'Failed to send message to Telegram channel!',
        icon: 'error',
        confirmButtonText: 'Okay'
      });
      return;
    }

    const inlineButton = {
      inline_keyboard: [
        [
          {
            text: "Apply Here",
            url: `${formURL}` + extractedCode
          },
          {
            text: "Filter Assignments",
            url: "https://t.me/PremiumTutorsAssignmentBot?start="
          }
        ]
      ]
    };
  
    try {
      await axios.post(url, {
        chat_id: academicId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: JSON.stringify(inlineButton)
      });
      await axios.post(url, {
        chat_id: musicId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: JSON.stringify(inlineButton)
      });

      Swal.fire({
        title: 'Success',
        text: 'Message sent to ACADEMIC & MUSIC Telegram channel!',
        icon: 'success',
        confirmButtonText: 'Cool'
      });
    } catch (error) {
      Swal.fire({
        title: error.message,
        text: 'Failed to send message to Telegram channel!',
        icon: 'error',
        confirmButtonText: 'Okay'
      });
    }

    
  };

  const sendToSports = async () => {
    const academicId = academicChannel; // Add your Telegram chat ID here
    const sportsId = sportsChannel;
    const message = textOutput1;
    const extractedCode = extractCode(message);
    const extractedFees = extractFees(message);

    if ((extractedCode.match(/\d/g) || []).length < 3) {
      Swal.fire({
        title: "Check your Case Code!",
        text: 'Failed to send message to Telegram channel!',
        icon: 'error',
        confirmButtonText: 'Okay'
      });
      return;
    } 

    if (extractedFees === null) {
      Swal.fire({
        title: "Check your Fees!",
        text: 'Failed to send message to Telegram channel!',
        icon: 'error',
        confirmButtonText: 'Okay'
      });
      return;
    }
    

    const inlineButton = {
      inline_keyboard: [
        [
          {
            text: "Apply Here",
            url: `${formURL}` + extractedCode
          },
          {
            text: "Filter Assignments",
            url: "https://t.me/PremiumTutorsAssignmentBot?start="
          }
        ]
      ]
    };
  
    try {
      await axios.post(url, {
      chat_id: academicId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: JSON.stringify(inlineButton)
      });
      await axios.post(url, {
        chat_id: sportsId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: JSON.stringify(inlineButton)
      });
      Swal.fire({
        title: 'Success',
        text: 'Message sent to ACADEMIC & SPORTS Telegram channel!',
        icon: 'success',
        confirmButtonText: 'Cool'
      });
    } catch (error) {
      Swal.fire({
        title: error.message,
        text: 'Failed to send message to Telegram channel!',
        icon: 'error',
        confirmButtonText: 'Okay'
      });
    }
  };

  const extractCode = (message) => {
    const codePattern = /Code:\s(\w+)/;
    const match = message.match(codePattern);
    return match ? match[1] : null;
  }

  const extractFees = (message) => {
    const codePattern = /Fees:\s(.+)/;
    const match = message.match(codePattern);
    return match ? match[1] : null;
  }
  
  const ConfirmationTemplate = (e) => {
    setTextOutput1(e.target.value);
    window.top.postMessage(
      { type: "CONFIRM_TEMPLATE_CHANGE_VALUE", changeValue: e.target.value },
      origin
    );
    console.log(e.target.value, origin, "ss");
  };


  
  return (
    <div className="convert">
      <div className="convert-row-1">
        {/* First Row */}
        {/* First row left section (form)*/}
        <div className="convert-form">
          <div className="form-title">Client Form</div>
          <form action="" onSubmit={handleSubmit}>
            <label htmlFor="client_name">Client Name</label>
            <input
              type="text"
              id="client_name"
              name="client_name"
              value={formData.client_name}
              onChange={handleInputChange}
              placeholder="Eg. Ms Nana"
              required
            />
            <div className="postal-code">
              <label htmlFor="postal">Postal Code</label>
              <input
                type="text"
                id="postal"
                name="postal"
                value={formData.postal}
                onChange={handleInputChange}
                placeholder="Eg. 051531"
                required
              />
              <div id="online">
                <input
                  type="checkbox"
                  id="online"
                  name="online"
                  value="online"
                  checked={formData.online}
                  onChange={handleInputChange}
                />
                <label htmlFor="online">Online Lessons</label>
              </div>
            </div>

            <label htmlFor="level">Level</label>
            <input
              type="text"
              id="level"
              name="level"
              value={formData.level}
              onChange={handleInputChange}
              placeholder="Eg. p5"
              required
            />
            <div className="subject">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Eg. math, science, english"
                required
              />
              <div id="separateTutor">
                <input
                  type="checkbox"
                  id="separateTutor"
                  name="separateTutor"
                  value="separateTutor"
                  checked={formData.separateTutor}
                  onChange={handleInputChange}
                />
                <label htmlFor="separateTutor">Separate Tutors</label>
              </div>
              <div id="sameTutor">
                <input
                  type="checkbox"
                  id="sameTutor"
                  name="sameTutor"
                  value="sameTutor"
                  checked={formData.sameTutor}
                  onChange={handleInputChange}
                />
                <label htmlFor="sameTutor">Same Tutor</label>
              </div>
            </div>

            <label htmlFor="frequency">Duration</label>
            <input
              type="text"
              id="frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleInputChange}
              placeholder="Eg. 1 x 2 hrs/ week"
              required
            />

            <label htmlFor="timings">Timings</label>
            <input
              type="text"
              id="timings"
              name="timings"
              value={formData.timings}
              onChange={handleInputChange}
              placeholder="Eg. Wednesday 7pm-8pm"
              required
            />
            <label htmlFor="tutor">Category of Tutor</label>
            <div id="tutor1">
              <input
                type="checkbox"
                id="tutor1"
                name="tutor1"
                value="ftt"
                checked={formData.tutor1}
                onChange={handleInputChange}
              />
              <label htmlFor="tutor1">Part Time/Undergrad Tutor</label>
            </div>
            <div id="tutor2">
              <input
                type="checkbox"
                id="tutor2"
                name="tutor2"
                value="ftt"
                checked={formData.tutor2}
                onChange={handleInputChange}
              />
              <label htmlFor="tutor2">Full Time/Graduate Tutor</label>
            </div>
            <div id="tutor3">
              <input
                type="checkbox"
                id="tutor3"
                name="tutor3"
                value="ftt"
                checked={formData.tutor3}
                onChange={handleInputChange}
              />
              <label htmlFor="tutor3">Ex /Current School Teachers</label>
            </div>

            <br />
            <label htmlFor="timings">Remarks</label>
            <input
              type="text"
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              placeholder="Tutor to be patient"
            />
            <div className="button">
                <input type="submit" id="submit" value="Submit" />
              <button
                type="button"
                onClick={handleReset}
                className="clear-form"
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>
        {/* First row middle section (Guide) */}
        <div className="guide">
          <div className="guide-title">Guide (Shortcuts)</div>
          <div className="guide-description">
            <div className="academic">
              <p>Pre School</p>
              <p>"pre", "preschool", "Pre school"</p>
              <p>Nursery</p>
              <p>"n", "nursery"</p>
              <p>Kindergarten 1-2</p>
              <p>"k1", "kindergarten 2"</p>
              <p>Primary 1-6</p>
              <p>"p1", "Pri 5", "primary2"</p>
              <p>Secondary 1-5</p>
              <p>"sec1", "Sec 3", "Secondary4"</p>
              <p>Junior College (JC)</p>
              <p>"jc", "junior", "junior college"</p>
              <p>IGCSE</p>
              <p>"is", "igcse"</p>
              <p>IB Diploma</p>
              <p>"ib"</p>
              <p>Tertiary</p>
              <p>"poly", "polytechnic"</p>
              <p>University</p>
              <p>"u","uni", "university"</p>
              <p>Adult Learner</p>
              <p>"adult", "adult learner"</p>
            </div>
            <div className="music">
              <p>Beginner (Music)</p>
              <p>"b", "beginner"</p>
              <p>Grade 1-8 (Music)</p>
              <p>"grade1", "g2", "g 5"</p>
              <p>Diploma (Music)</p>
              <p>"diploma"</p>
              <p>Leisure (Music)</p>
              <p>"leisure"</p>
              <p>Badminton (Sports)</p>
              <p>"badminton"</p>
              <p>Tennis (Sports)</p>
              <p>"tennis"</p>
              <br />
              <br />
              <p>Subjects available</p>
              <p>Music: Piano, Guitar, Violin, Drums, Ukulele</p>
              <br />
              <p>Sports: private, pair, group</p>
            </div>
          </div>  
        </div>
        {/* First row Right section (form-output) */}
      </div>
      {/* Loading */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loader-container">
          <DotLoader color="#36d7b7" />
          </div>
        </div>
      )}
      {/* Second row Right section (form-output) */}
      <div className="convert-row-2">
        <div className="convert-output">
          <div className="convert-output-title">Telegram Template</div>
          <textarea
            name=""
            id=""
            cols="50"
            rows="30"
            value={textOutput1}
            // onChange={(e) => setTextOutput1(e.target.value)}
            onChange={(e) => ConfirmationTemplate(e)}
          ></textarea>

          <div className="convert-button">
            <button onClick={convertTeleToMany}>
              Convert to Many Tutors Format
            </button>
            <div className="clip">
              <button
                className="clipboard"
                onClick={() => {
                  copyToClipboard(textOutput1);
                  setCopy("✓ Copied to Clipboard!");
                  setCopy2("Copy to Clipboard");
                }}
              >
                {copy}
              </button>

            </div>
          </div>
        </div>
        <div className="convert-output-2">
          <div className="convert-output-title-2">Many Tutors Template</div>
          <textarea
            name=""
            id=""
            cols="50"
            rows="30"
            value={textOutput2}
            onChange={(e) => setTextOutput2(e.target.value)}
          ></textarea>

          <div className="convert-button">
            <button onClick={convertManyToTele}>
              Convert to Telegram Format
            </button>
            <div className="clip">
              <button
                className="clipboard2"
                onClick={() => {
                  copyToClipboard(textOutput2);
                  setCopy("Copy to Clipboard");
                  setCopy2("✓ Copied to Clipboard!");
                }}
              >
                {copy2}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="send-telegram">
        <h1>Send to Telegram Channels</h1>
        <div className="channel">
          <button onClick={sendToAcademic}>
            ACADEMIC
          </button>
          <button onClick={sendToMusic}>
            MUSIC
          </button>
          <button onClick={sendToSports}>
            SPORTS
          </button>
        </div>
        
      </div>

    </div>
  );
};

export default Convert;


document.getElementById("searchForm").addEventListener("submit", async function (e) {

    e.preventDefault();

    // récuperer la ville d'entrée
    const city = document.getElementById("cityInput").value.trim();
    if (!city) {
        alert("Veuillez entrer une ville ou un code postal!");
        return;
    }

    // Construire l'URL de l'API Open-Meteo
    //count=5 ==>API Open-Meteo me fourni max 5 résultat (par défault = 10)
    //countryCode=FR ==> Fr.o. code postaljat vegye figyelembe és ne dobjon ki Spanyolba!!!
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&countryCode=FR`;
    //vagy `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=5&format=json&language=fr&countryCode=FR`;
    // https://geocoding-api.open-meteo.com/v1/search?name=${city} ==> je peux chercher dans le monde en tapant a varosnevet
   
    try{
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        // permet d'attendre la résolution d'une promesse
        // il peut être utilisé que dans la fonction async!!!
        if (!geoData.results || geoData.results.length === 0) {
            alert("Ville non trouvée !");
            return;
        }

        const { latitude, longitude } = geoData.results[0];

        // Afficher la carte après avoir récupéré les coordonnées
        displayMap(latitude, longitude);

        // Réinitialiser la carte si nécessaire
        if (document.getElementById("map")._leaflet_id) {
            document.getElementById("map")._leaflet_id = null;
        }

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode,wind_speed_10m_max,sunrise,sunset&timezone=Europe%2FParis`;
            const weatherRes = await fetch(weatherUrl);
            const weatherData = await weatherRes.json();
            displayWeather(weatherData);
    } catch (error) {
            console.error("Erreur lors de la récupération des données météo :", error);
            alert("Impossible de récupérer les données météo. Veuillez réessayer plus tard.");
    }
});

const weatherCodesOMM = {
    0: { description: "Ciel clair", icon: "https://img.icons8.com/color/48/sun.png" },
    1: { description: "Généralement clair", icon: "https://img.icons8.com/?size=100&id=15359&format=png&color=000000" },
    2: { description: "Partiellement nuageux", icon: "https://img.icons8.com/?size=100&id=15359&format=png&color=000000" },
    3: { description: "Couvert", icon: "https://img.icons8.com/color/48/cloud.png" },
    45: { description: "Brouillard", icon: "https://img.icons8.com/color/48/fog-day.png" },
    48: { description: "Brouillard avec dépôt de givre", icon: "https://img.icons8.com/?size=100&id=LktBoDfNx5kT&format=png&color=000000" },
    51: { description: "Bruine légère", icon: "https://img.icons8.com/?size=100&id=18609&format=png&color=000000" },
    53: { description: "Bruine modérée", icon: "https://img.icons8.com/color/48/light-rain.png" },
    55: { description: "Bruine dense", icon: "https://img.icons8.com/color/48/heavy-rain.png" },
    56: { description: "Bruine verglaçante légère", icon: "https://img.icons8.com/color/48/sleet.png" },
    57: { description: "Bruine verglaçante dense", icon: "https://img.icons8.com/color/48/sleet.png" },
    61: { description: "Pluie légère", icon: "https://img.icons8.com/color/48/light-rain.png" },
    63: { description: "Pluie modérée", icon: "https://img.icons8.com/color/48/rain.png" },
    65: { description: "Pluie forte", icon: "https://img.icons8.com/color/48/heavy-rain.png" },
    66: { description: "Pluie verglaçante légère", icon: "https://img.icons8.com/color/48/light-rain.png" },
    67: { description: "Pluie verglaçante forte", icon: "https://img.icons8.com/color/48/heavy-rain.png" },
    71: { description: "Chutes de neige légères", icon: "https://img.icons8.com/color/48/snowflake.png" },
    73: { description: "Chutes de neige modérées", icon: "https://img.icons8.com/color/48/snow.png" },
    75: { description: "Chutes de neige fortes", icon: "https://img.icons8.com/color/48/snow.png" },
    77: { description: "Grains de neige", icon: "https://img.icons8.com/color/48/hail.png" },
    80: { description: "Averses de pluie légères", icon: "https://img.icons8.com/?size=100&id=19541&format=png&color=000000" },
    81: { description: "Averses de pluie modérées", icon: "https://img.icons8.com/?size=100&id=19541&format=png&color=000000" },
    82: { description: "Averses de pluie violentes", icon: "https://img.icons8.com/color/48/heavy-rain.png" },
    85: { description: "Averses de neige légères", icon: "https://img.icons8.com/color/48/snowflake.png" },
    86: { description: "Averses de neige fortes", icon: "https://img.icons8.com/color/48/snow.png" },
    95: { description: "Orage léger ou modéré", icon: "https://img.icons8.com/color/48/storm.png" },
    96: { description: "Orage avec grêle légère", icon: "https://img.icons8.com/?size=100&id=ESeqfDjC5eVO&format=png&color=000000" },
    99: { description: "Orage avec grêle forte", icon: "https://img.icons8.com/?size=100&id=6AAyqKfBlzoB&format=png&color=000000" }
};


function displayWeather(data) {
    const result = document.getElementById("result");
    const resultMeteo = document.getElementById("result-meteo");
    result.innerHTML = "";
    resultMeteo.innerHTML = ""

    const days = data.daily.time;
    // const dateFr = formatDate(days);
    const maxTemp = data.daily.temperature_2m_max;
    const minTemp = data.daily.temperature_2m_min;
    const maxWind = data.daily.wind_speed_10m_max;
    const weatherCodes = data.daily.weathercode;
    const sunrise = data.daily.sunrise;
    const sunset = data.daily.sunset;

    function getWeatherDetails(weatherCode) {
        const details = weatherCodesOMM[weatherCode] || {
            description: "Condition inconnue",
            icon: "https://img.icons8.com/color/48/sun.png"
        };
        return details;
        //console.log(`Code météo ${weatherCode}: ${details.description} - ${details.icon}`); // Debug
    }

    //afficher la moyenne de min et max temperatures pendant 7 jours
    const minMoyTemps = moyenneTableau(minTemp);
    const maxMoyTemps = moyenneTableau(maxTemp);

    // console.log("La moyenne de la témpérature minimim pour ces jours est:" + moyenneTableau(minTemp));
    const moyen =  `
        <div class="col-12 mb-3 text-center fs-4 mt-5">
            <p class="fw-bolder">La moyenne de la témpérature minimim pour ces 7 jours est:</p>
            <p class="text-center text-primary fw-bold"> ${minMoyTemps} C°</p>
        </div>
         <div class="col-12 mb-3 text-center fs-4">
            <p class="fw-bolder">La moyenne de la témpérature maximum pour ces 7 jours est:</p>
            <p class="text-center text-danger fw-bold"> ${maxMoyTemps} C°</p>
        </div>
        `;
    result.innerHTML += moyen;
    
    for (let i = 0; i < days.length; i++) {

        //mettre en forme de l'heure-minute le lever du soleil et le coucher du soleil
        const formatedSunrise = formatTime(sunrise[i]);
        const formatedSunset = formatTime(sunset[i]);

        //mettre la date en format fr
        const formatedDate = formatDate(days[i]);

         // Image par défaut si le code est inconnu
        const { description, icon } = getWeatherDetails(weatherCodes[i]);
        
        const card = `
            <div class="col-md-4 mb-3 mt-3">
                <div class="card shadow justify-content-center">
                    <div class="card-body d-flex flex-column align-items-center">
                        <h5 class="card-title">${formatedDate}</h5>
                       <img src="${icon}" alt="${description}" style="width:50px; height:50px;">

                        <p class="card-text"> 
                            <img width="20" height="20" src="https://img.icons8.com/color/48/cold.png" alt="cold"/>
                            Min : ${minTemp[i]}°C
                        </p>
                        <p class="card-text">
                            <img width="20" height="20" src="https://img.icons8.com/color/48/hot.png" alt="hot"/>
                            Max : ${maxTemp[i]}°C
                        </p>
                         <p class="card-text">
                            <img width="20" height="20" src="https://img.icons8.com/color/48/air-element.png" alt="air-element"/>
                            Vent : ${maxWind[i]} Km/h
                        </p>
                        <p class="card-text">
                            <img id="sunrise" class="me-2" src="https://img.icons8.com/?size=100&id=s51JxxE1J6OO&format=png&color=000000"/>
                            Lever du soleil : ${formatedSunrise}
                        </p>
                        <p class="card-text">
                            <img id="sunset" class="me-2" src="https://img.icons8.com/?size=100&id=L5pcGEmaO18S&format=png&color=000000"/>
                            Coucher du soleil : ${formatedSunset}
                        </p>

                    </div>
                </div>
            </div>
            `;
        resultMeteo.innerHTML += card;
    }
}

function moyenneTableau(numbers){

    let som = 0;
    //let moy; 

    for(let i = 0; i < numbers.length; i++)
    {
        som = som + numbers[i];
    }
    moy = som / numbers.length
    return moy.toFixed(2);
}


function formatDate(isoDate) {
    const date = new Date(isoDate); // Créer un objet Date à partir de la chaîne ISO
    const options = { 
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
    };
    return new Intl.DateTimeFormat("fr-FR", options).format(date); // Formatter la date en français
}

function formatTime(isoTime) {
    const date = new Date(isoTime); // Convertir en objet Date
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); // Formater en HH:mm
}




// Fonction pour afficher la carte
function displayMap(lat, lon) {

    // Initialiser la carte
    const map = L.map("map").setView([lat, lon], 9); // Latitude, longitude et niveau de zoom initial

    // Ajouter les tuiles (tiles) OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Ajouter un marqueur sur la carte
    // L.marker([lat, lon]).addTo(map).bindPopup("Voici votre city!").openPopup();

    L.marker([lat, lon]).addTo(map).bindPopup("Voici " + document.getElementById("cityInput").value).openPopup();
}
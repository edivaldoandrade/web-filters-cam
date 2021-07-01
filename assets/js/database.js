
  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  var firebaseConfig = {
    apiKey: "AIzaSyD6pGxXUwMKOVioh3gfI0oHnlInbtElGEY",
    authDomain: "yoha-c47cb.firebaseapp.com",
    projectId: "yoha-c47cb",
    storageBucket: "yoha-c47cb.appspot.com",
    messagingSenderId: "375923734672",
    appId: "1:375923734672:web:3a8b64833368cc5ca78015",
    measurementId: "G-CML1S3HLVS"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  firebase.analytics();
  

let videos=[];
let uid;

const signOut=()=>{
    firebase.auth().signOut().then(function() {
        window.location.href = '../index.html';
        let menu=document.getElementById("opcaoMenus");
        menu.removeChild(menu.childNodes[4])
    }).catch(function(error) {
        // An error happened.
    });
}

 
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                uid=user.uid;
                let menu=document.getElementById("opcaoMenus");
              

                let itemMenu=document.createElement('li');
                itemMenu.className="nav-item";
                let itemMenuA=document.createElement('a');
                itemMenuA.className="nav-link";
                itemMenuA.innerHTML="Videos";
                itemMenuA.setAttribute("href","videos.html");
                itemMenu.appendChild(itemMenuA);
                menu.appendChild(itemMenu);

                itemMenu=document.createElement('li');
                itemMenu.className="nav-item";
                itemMenuA=document.createElement('a');
                itemMenuA.className="nav-link";
                itemMenuA.innerHTML="Sair";
                itemMenuA.onclick=signOut;
                itemMenu.appendChild(itemMenuA);
                menu.appendChild(itemMenu);

                menu.removeChild(menu.childNodes[5]);

            } else { 
                
            }
        });


const createAccount=()=>{
    let email=document.getElementById("email").value;
    let senha = document.getElementById("senha").value;
        firebase.auth().createUserWithEmailAndPassword(email, senha).then((result)=>{
            
        }).catch(function(error) {
            var errorCode = error.code;
            var errorMessage = error.message;
        });
}

const login = () =>{
    let email=document.getElementById("email").value;
    let senha = document.getElementById("senha").value;
    firebase.auth().signInWithEmailAndPassword(email, senha)
        .then(function() {

            window.location.href = 'camera.html';

        }).catch(function(error) {
           alert("email ou senha invalida")
        });
}

const getVideos=()=>{
    firebase.firestore().collection("videos").get()
    .then((doc) => {
        doc.forEach(urls=>{

            if(urls.data().uid==uid)
          videos.push(urls.data().url);
        });
        let tag=document.getElementById("videos");
        console.log(videos)

        videos.forEach((value)=>{
            let video=document.createElement("video");
            let source = document.createElement("source");
            source.setAttribute("src",value+"#t=0.1");
            source.setAttribute("type","video/mp4");
            video.style.width="30%";
            video.style.margin=".3vh";
            video.setAttribute('controls',true);
            video.appendChild(source);
            tag.appendChild(video);
        });

      })
}



console.log("opla")
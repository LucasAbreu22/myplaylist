import { useEffect, useState } from 'react';
import './App.css';
import Axios from "axios";
import unknow from "./img/interrogacao.jpg";

function App() {
  const [search, setSearch] = useState("");
  const [clientID, setClientID] = useState("51e617ad49bf4d608eb77c2f3518dad0");
  const [idPlaylist, setIdPlaylist] = useState("5tXoh1D5GMB2VriY5Thd63");
  const [token, setToken] = useState(null);
  const [configReq, setConfigReq] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState("0");
  const [prevList, setPrevList] = useState("");
  const [nextList, setNextList] = useState("");

  let url = `https://api.spotify.com/v1/playlists/${idPlaylist}/tracks?limit=15&offset=0`

  function getAutorization()
  {

    const endpoint = "https://accounts.spotify.com/authorize";
    const redirect_uri = "http://192.168.100.104:3000/";
    return false;
    const queryParams = new URLSearchParams({
      response_type: 'token',
      client_id: clientID,
      redirect_uri: redirect_uri,
      scope: [
        "playlist-modify-private",
        "playlist-modify-public"
      ]
    });
   
    const authorizationUrl = `${endpoint}?${queryParams.toString()}`;
    window.location.href = authorizationUrl;
  }

  useEffect(()=>{
    const hash = window.location.hash;

    if(hash)
    {
      setToken(hash.substring(1).split("&").find(elem => elem.startsWith("access_token")).split("=")[1]);
      
    }else{
      getAutorization()
    }
  },[])
  
  useEffect(() => 
  {
    if(token) 
    {
      setConfigReq({headers: {'Authorization': `Bearer ${token}`}});

    };
  },[token]);

  useEffect(() =>
  {
    if(configReq) getPlaylistSong();

  },[configReq])

  function getPlaylistSong(event = null)
  {
    if(event === "NEXT") 
    {
      if(!nextList) return false;
      
      url = nextList
    }
    
    else if(event === "PREVIOUS")
    { 
      if(!prevList) return false;
      url = prevList
    }

    Axios.get(
      url,
      configReq,
      )
      .then(async response => {

        await insertSongs(response.data.items)

        if(event === "NEXT") setCurrentPage(currentPage + 1)
        
        else if(event === "PREVIOUS") setCurrentPage(currentPage - 1)
        
        setPrevList(response.data.previous);
        setNextList(response.data.next);
        setPages(Math.ceil(response.data.total / 15));

      })
      .catch(error => {
        // Erro
        if(error.response.data.error.status === 401)
        {
          alert("Token expirado! Clique em OK para gerar um novo.");

          getAutorization();
        }
        else{
          alert('Erro ao obter faixas da playlist:', error.response.data);
        }
      });
  }

  function getSong(e)
  {
    if(e.keyCode !== 13) return false;

    if(search.indexOf("open.spotify.com/") < 0)
    {
      alert("Link inválido! Insira um link de compartilhamento do spotify!");
      return false;
    }

    let id_song = search.split("?")[0].split("/").pop()
    
    Axios.get(
      `https://api.spotify.com/v1/tracks/${id_song}`,
      configReq,
      )
      .then(response => {
        // Sucesso
        insertBigCard(response.data);
      })
      .catch(error => {
        // Erro
        if(error.response.data.error.status === 400)
        {
          alert("Música Inválida!");
        }
        else if(error.response.data.error.status === 404)
        {
          alert("Música não encontrada!");
        }else
        {
          alert("Link inválido! Insira um link de compartilhamento do spotify!");
        }
      });
      
      setSearch("")
  }

  function insertBigCard(song)
  {

    let big_card = `<div id='big-card' class='card'>
                      <img src='${song.album.images[1].url}'/>
                      <div class='info-card'>
                        <div>
                          <span>${song.name}</span> <br/>
                          <span>`;
                          
    for(let j = 0; j < song.artists.length; j++)
    {
      big_card += j < 1 ? song.artists[j].name : `, ${song.artists[j].name}`;
    }                      

    big_card += `</span> <br/>       
                <span>Duração: ${convertMS(song.duration_ms)}</span><br/>
                </div>
                <button id="addSongButton">Adicionar</button>
              </div>
            </div>`;

    let sct_big_card = document.getElementById("sct-big-card");
    sct_big_card.innerHTML = big_card;

    document.getElementById("addSongButton").addEventListener("click", function() {
      addSong(song.uri);
    });
  
  }

  function convertMS(ms)
  {
    let minutes = Math.floor(ms / 60000);
    let seconds = ((ms % 60000) / 1000).toFixed(0);
    
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    return minutes + ':' + seconds;
  }

  async function insertSongs(songs)
  {

    let song_card = '';

    for(let i = 0; i < songs.length; i++)
    {
      song_card += ` <div class='card simple-card'>
                        <img src='${songs[i].track.album.images[1].url}'/>
                        <div class='info-card'>
                          <div>
                            <span>${songs[i].track.name}</span> <br/>
                            <span>`;
      for(let j = 0; j < songs[i].track.artists.length; j++)
      {
        song_card += j < 1 ? songs[i].track.artists[j].name : `, ${songs[i].track.artists[j].name}`;
      }
      song_card += `</span> <br/>
                  </div>
                  <a href='${songs[i].track.external_urls.spotify}' target="_blank"><button><i class="fa-solid fa-music"></i> Confira</button></a>
                </div>
              </div>`
    }

    let song_list = document.getElementById("songs");
    song_list.innerHTML = song_card;
  }

  function addSong(uri){
    Axios.post(
      `https://api.spotify.com/v1/playlists/${idPlaylist}/tracks`,
      {
        uris: [uri],
        position: 0,
      },
      configReq,
      )
      .then(response => {
        // Sucesso
        getPlaylistSong()
      })
      .catch(error => {
        // Erro
        console.error('Erro ao obter música: ', error.response.data);
      });
    
  }

  return (
    <div className="App">

      <section id='sct-search'>
        <input className="input-text" 
        value={search} 
        onChange={e => setSearch(e.target.value)}
        onKeyUp={e => getSong(e)}
        placeholder='Link da música'/>
      </section>

      <section id='sct-big-card'>
        <div id='big-card' className='card'>
          <img src={unknow}/>
          <div className='info-card'>
            <div>
              <span>-------</span> <br/>
              <span>-------</span> <br/>
              <span>Duração: --:--</span><br/>
            </div>
            <button>Adicionar</button>
          </div>
        </div>
      </section>

      <section>
        <h1 id="title">Músicas da festa</h1>

        <div id='navigation'>
          <button onClick={() => getPlaylistSong("PREVIOUS")}>
            <i className="fa-solid fa-arrow-left"></i>{window.screen.availWidth < 768 ?<span id="spn-back"> Voltar</span> : ""}
          </button>
          <span>{currentPage}/{pages}</span>
          <button onClick={() => getPlaylistSong("NEXT")}>
          {window.screen.availWidth < 768 ?<span id="spn-next"> Avançar</span> : ""}<i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
        
        <br/>
        <div id='songs'>

        </div>
      </section>
    </div>
  );
}

export default App;

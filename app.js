
//-----------------------------------------------------------------------------

class TTS
{
//-----------------------------------------------

  constructor()
  {
    this.messageCount = 0;
    this.easterEggInterval = 50;
    this.ttsTag = "!tts";

    this.listenBtn = document.getElementById("listenBtn");
    this.volumeSlider = document.getElementById("volume");
    this.status = document.getElementById("status");
    this.channel = document.getElementById("channelname");
    this.ignoreFilterCheckbox = document.getElementById("ignore-filter-toggle");
    this.messages = document.getElementById("messages");
    this.audiotrack = document.getElementById("audiotrack");
    this.voiceSelect = document.getElementById("voiceSelect");

    this.listenBtn.addEventListener('click', (event) => this.onListenBtnClicked(event));
    this.volumeSlider.addEventListener('change', (event) => this.onVolumeChanged(event));
  }

//-----------------------------------------------

  populateVoiceList()
  {
    if (typeof window.speechSynthesis === "undefined")
    {
      return;
    }

    this.voiceSelect.innerHTML = "";
    const voices = speechSynthesis.getVoices();

    for (let i = 0; i < voices.length; ++i)
    {
      const option = document.createElement("option");
      option.textContent = `${voices[i].name} (${voices[i].lang})`;

      option.setAttribute("data-lang", voices[i].lang);
      option.setAttribute("data-name", voices[i].name);
      this.voiceSelect.appendChild(option);
    }
  }

//-----------------------------------------------

  isChannelValid(_channel)
  {
      return _channel.match(/^(#)?[a-zA-Z0-9_]{4,25}$/) != undefined; 
  }

//-----------------------------------------------

  isMessageValid(_tags, _message)
  {
    let isBypassUser =  (_tags != undefined) && (_tags["user-id"] == "24588902");
    let isSub = (_tags != undefined) && (_tags.subscriber);
    let isPaid = (_tags != undefined) && (_tags["custom-reward-id"] == "97bbb253-9aad-4014-a061-b9c0139dd92c");
    let isTTSMessage= _message.search(this.ttsTag) >= 0;
    let ignoreFilter = this.ignoreFilterCheckbox.checked;

    return ignoreFilter || isPaid || ((isSub || isBypassUser) && isTTSMessage);
  }

//-----------------------------------------------

  preprocess(_message)
  {
    ++this.messageCount;
    _message = _message.replace(this.ttsTag, "");

    if ((this.messageCount % this.easterEggInterval) == 0)
    {
      _message = "Merci Luc. " + _message;
    }

    return _message;
  }

//-----------------------------------------------

write(_tags, _message, _isValid)
{
  let div = document.createElement('div'); 
  div.className = "single-message";

  let chatter = document.createElement('span'); 
  chatter.className= "chatter";
  chatter.style.color = _tags['color'];
  chatter.textContent = _tags['display-name']+': ';

  let warning = undefined;
  
  if (!_isValid)
  {
    warning = document.createElement('span'); 
    warning.className= "filter";
    warning.style.color = "red";
    warning.textContent = " <Message filtered> ";
  }

  let chatMessage = document.createElement('span'); 
  chatMessage.className= "messageContent"; 
  chatMessage.textContent = _message; 

  div.appendChild(chatter); 

  if (warning != undefined)
  {
    div.appendChild(warning);
  }

  div.appendChild(chatMessage); 

  this.messages.appendChild(div); 
}

//-----------------------------------------------

  speak(_message)
  {
    const voices = window.speechSynthesis.getVoices();
    let utterance = new SpeechSynthesisUtterance(_message);
    const selectedOption = this.voiceSelect.selectedOptions[0].getAttribute("data-name");
    
    for (let i = 0; i < voices.length; ++i)
    {
      if (voices[i].name === selectedOption)
      {
        utterance.voice = voices[i];
        break;
      }
    }

    utterance.volume = this.volumeSlider.value;
    window.speechSynthesis.speak(utterance);

    document.getElementById("audiotrack").pause();
    document.getElementById("audiotrack").currentTime = 0;
  }

//-----------------------------------------------

  onListenBtnClicked(_event)
  {
    let channel = this.channel.value;

    _event.preventDefault();

    if (!this.isChannelValid(channel))
    {
      this.status.className = "alert alert-danger";
      this.status.textContent = "Invalid channel name";
      return;
    }

    this.client = new tmi.Client(
    {
      connection:
      {
        secure: true,
        reconnect: true,
      },
      channels: [channel]
    });

    this.client.connect().then(() =>
    {
      this.status.className = "alert alert-success";
      this.status.textContent = `Connected to ${channel}'s chat`;
    });

    this.client.on('message', (wat, tags, message, self) =>
    {
      this.onMessage(tags, message);
    });

    this.listenBtn.textContent = "Listening...";
    this.listenBtn.disabled = true;
  }

//-----------------------------------------------

  onMessage(_tags, _message)
  {
    if (!this.isMessageValid(_tags, _message))
    {
      this.write(_tags, _message, false);
      return;
    }

    _message = this.preprocess(_message);
    this.speak(_message);
    this.write(_tags, _message, true);
  }

//-----------------------------------------------

  onVolumeChanged(_event)
  {
    this.audiotrack.volume = this.volumeSlider.value;
  }

//-----------------------------------------------

}

//-----------------------------------------------------------------------------

let tts = new TTS();
window.speechSynthesis.onvoiceschanged = () =>
{
  tts.populateVoiceList();
}
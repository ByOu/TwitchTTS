
//-----------------------------------------------------------------------------

class TTS
{
//-----------------------------------------------

  constructor()
  {
    this.messageCount = 0;
    this.easterEggInterval = 50;
    this.ttsTag = "!tts";
    this.settings = {entries: []};

    this.listenBtn = document.getElementById("listenBtn");
    this.volumeSlider = document.getElementById("volume");
    this.settingsBtn = document.getElementById("settingsBtn");
    this.addEntryBtn = document.getElementById("addEntryBtn");
    this.status = document.getElementById("status");
    this.channel = document.getElementById("channelname");
    this.ignoreFilterCheckbox = document.getElementById("ignore-filter-toggle");
    this.displayRewardIdCheckbox = document.getElementById("display-reward-id-toggle");
    this.messages = document.getElementById("messages");
    this.audiotrack = document.getElementById("audiotrack");
    this.voiceSelect = document.getElementById("voiceSelect");
    this.settingsContent = document.getElementById("settings-content");
    this.entryContent = document.getElementById("entry-content");

    this.listenBtn.addEventListener('click', (event) => this.onListenBtnClicked(event));
    this.volumeSlider.addEventListener('change', (event) => this.onVolumeChanged(event));
    this.settingsBtn.addEventListener('click', (event) => this.onSettingsBtnClicked(event));
    this.addEntryBtn.addEventListener('click', (event) => this.onAddEntryBtnClicked(event));
    this.voiceSelect.addEventListener('change', (event) => this.onVoiceSelect(event));
  }

//-----------------------------------------------

  loadSettings()
  {
    let loadedSettings = JSON.parse(window.localStorage.getItem("settings"));

    if (loadedSettings != undefined)
    {
      this.settings = loadedSettings;
    }

    for (let i = 0; i < this.settings.entries.length; ++i)
    {
      this.createEntry(i, this.settings.entries[i].id, this.settings.entries[i].voice);
    }
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
    const lastVoice = window.localStorage.getItem("lastVoice");
    let lastVoiceIndex = -1;

    for (let i = 0; i < voices.length; ++i)
    {
      const option = document.createElement("option");
      option.textContent = `${voices[i].name} (${voices[i].lang})`;

      option.setAttribute("data-lang", voices[i].lang);
      option.setAttribute("data-name", voices[i].name);
      this.voiceSelect.appendChild(option);

      if ((lastVoice != undefined) && (voices[i].name == lastVoice))
      {
        lastVoiceIndex = i;
      }
    }

    if (lastVoiceIndex > 0)
    {
      this.voiceSelect.options.selectedIndex = lastVoiceIndex;
    }

    // We delay loadSettings after the voice list has been populated so we can properly populate entries
    this.loadSettings();
  }

//-----------------------------------------------

  isChannelValid(_channel)
  {
      return _channel.match(/^(#)?[a-zA-Z0-9_]{4,25}$/) != undefined; 
  }

//-----------------------------------------------

  isPaid(_tags)
  {
    let reward = _tags["custom-reward-id"];

    if (reward == undefined)
    {
      return false;
    }

    for (let i = 0; i < this.settings.entries.length; ++i)
    {
      if (this.settings.entries[i].id == reward)
      {
        return true;
      }
    }
  }

//-----------------------------------------------

  isMessageValid(_tags, _message)
  {
    let isBypassUser =  (_tags != undefined) && (_tags["user-id"] == "24588902");
    let isSub = (_tags != undefined) && (_tags.subscriber);
    let isTTSMessage= _message.search(this.ttsTag) >= 0;
    let ignoreFilter = this.ignoreFilterCheckbox.checked;

    return ignoreFilter || ((isSub || isBypassUser) && isTTSMessage) || this.isPaid(_tags);
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
  div.appendChild(chatter); 

  if (!_isValid)
  {
    let warning = document.createElement('span'); 
    warning.className= "filter";
    warning.style.color = "red";
    warning.textContent = " <Message filtered> ";
    div.appendChild(warning);
  }

  let customRewardId = _tags["custom-reward-id"];

  if (this.displayRewardIdCheckbox.checked && (customRewardId != undefined))
  {
    let reward = document.createElement('span'); 
    reward.className= "reward";
    reward.style.color = "green";
    reward.textContent = " <custom-reward-id: " + customRewardId + ">";
    div.appendChild(reward);
  }

  let chatMessage = document.createElement('span'); 
  chatMessage.className= "messageContent"; 
  chatMessage.textContent = _message; 
  div.appendChild(chatMessage); 

  this.messages.appendChild(div); 
}

//-----------------------------------------------

  speak(_message, _voice)
  {
    let utterance = new SpeechSynthesisUtterance(_message);

    utterance.voice = _voice;
    utterance.volume = this.volumeSlider.value;
    window.speechSynthesis.speak(utterance);

    document.getElementById("audiotrack").pause();
    document.getElementById("audiotrack").currentTime = 0;
  }

//-----------------------------------------------

  createEntry(_entryIndex, _id, _voice)
  {
    let row = document.createElement('div');
    row.className = "row";

    let rewardEntryDiv = document.createElement('div');
    rewardEntryDiv.className = "col-6";
    row.appendChild(rewardEntryDiv);

    let customRewardText = document.createElement('input');
    customRewardText.type = "text";
    customRewardText.classList.add("form-control");
    customRewardText.classList.add("custom-reward-entry");
    customRewardText.placeholder = "custom-reward-id";
    customRewardText.entryIndex = _entryIndex;
    customRewardText.value = _id;
    rewardEntryDiv.appendChild(customRewardText);

    let voiceSelectDiv = document.createElement('div');
    voiceSelectDiv.className = "col-6";
    row.appendChild(voiceSelectDiv);

    let voiceSelect = document.createElement('select');
    voiceSelect.classList.add("form-control");
    voiceSelect.classList.add("voice-select-entry");
    voiceSelect.entryIndex = _entryIndex;
    voiceSelectDiv.appendChild(voiceSelect);

    voiceSelect.innerHTML = this.voiceSelect.innerHTML;

    for (let i = 0; i < voiceSelect.options.length; ++i)
    {
      if (voiceSelect.options[i].attributes["data-name"].value == _voice)
      {
        voiceSelect.options.selectedIndex = i;
        break;
      }
    }

    customRewardText.addEventListener('change', (event) => this.onRewardEntryChanged(event, _entryIndex));
    voiceSelect.addEventListener('change', (event) => this.onRewardEntryChanged(event, _entryIndex));

    this.entryContent.appendChild(row);
  }

//-----------------------------------------------

  onAddEntryBtnClicked(_event)
  {
    let entryNumber = this.settings.entries.length;

    this.createEntry(entryNumber, "", "");
    this.settings.entries[entryNumber] = {id: "", voice: ""};
  }

//-----------------------------------------------

  onRewardEntryChanged(_event, _entryNumber)
  {
    let rewards = document.getElementsByClassName("custom-reward-entry");
    let voices = document.getElementsByClassName("voice-select-entry");

    let rewardEntry = undefined;
    let voiceEntry = undefined;

    for (let i = 0; i < rewards.length; ++i)
    {
      if (rewards[i].entryIndex == _entryNumber)
      {
        rewardEntry = rewards[i];
        break;
      }
    }

    for (let i = 0; i < voices.length; ++i)
    {
      if (voices[i].entryIndex == _entryNumber)
      {
        voiceEntry = voices[i];
        break;
      }
    }

    let voiceName = voiceEntry.options[voiceEntry.selectedIndex].attributes["data-name"].value;

    this.settings.entries[_entryNumber] = {id: rewardEntry.value, voice: voiceName};
    window.localStorage.setItem("settings", JSON.stringify(this.settings));
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

  onSettingsBtnClicked(_event)
  {
    if (this.settingsContent.classList.contains("d-none"))
    {
      this.settingsContent.classList.remove("d-none");
    }
    else
    {
      this.settingsContent.classList.add("d-none");
    }
  }

//-----------------------------------------------

  onMessage(_tags, _message)
  {
    if (!this.isMessageValid(_tags, _message))
    {
      this.write(_tags, _message, false);
      return;
    }

    let voiceName = this.voiceSelect.selectedOptions[0].getAttribute("data-name");
    let reward = _tags["custom-reward-id"];

    if (reward != undefined)
    {
      for (let i = 0; i < this.settings.entries.length; ++i)
      {
        if (this.settings.entries[i].id == reward)
        {
          voiceName = this.settings.entries[i].voice;
          break;
        }
      }
    }

    const voices = window.speechSynthesis.getVoices();
    let voice = undefined;
    
    for (let i = 0; i < voices.length; ++i)
    {
      if (voices[i].name === voiceName)
      {
        voice = voices[i];
        break;
      }
    }

    _message = this.preprocess(_message);
    this.speak(_message, voice);
    this.write(_tags, _message, true);
  }

//-----------------------------------------------

  onVolumeChanged(_event)
  {
    this.audiotrack.volume = this.volumeSlider.value;
  }

//-----------------------------------------------

  onVoiceSelect(_event)
  {
    const selectedOption = this.voiceSelect.selectedOptions[0].getAttribute("data-name");

    if (selectedOption != undefined)
    {
      window.localStorage.setItem("lastVoice", selectedOption);
    }
  }

//-----------------------------------------------

}

//-----------------------------------------------------------------------------

let tts = new TTS();
window.speechSynthesis.onvoiceschanged = () =>
{
  tts.populateVoiceList();
}
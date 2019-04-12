$(function () {
  // if user is running mozilla then use it's built-in WebSocket
  window.WebSocket = window.WebSocket || window.MozWebSocket;

  let connection = new WebSocket('ws://127.0.0.1:8080');

  let chat_header = $('#chat-header');
  let chat_content = $('#chat-content');
  let chat_bar = $('#chat-bar');

  let user;

  connection.onopen = function () {
    $('#status').html('enter your name');
    $('#username').attr('disabled', false)
  };

  connection.onerror = function (error) {
    // an error occurred when sending/receiving data
  };

  connection.onmessage = function (res) {
    // try to decode json (I assume that each message
    // from server is json)
    //console.log(res)
    try {
      let json = JSON.parse(res.data);

      if(json.type == 'exit_room') {
        let content = "<div class='col col-2'><div id='rooms'><h4>Room List</h4><div></div></div></div><div class='col col-10'><div class='chat' id='chat'></div></div>";
        chat_content.html(content);
        let bar = '<div class="col col-12 d-flex"><div class="col col-10"><input type="text" class="message" id="message" /></div><div class="col col-2"><input type="submit" class="send-msg" id="send-msg" value="SEND"></div></div>';
        chat_bar.html(bar);
        let createRoomInput = '<div style="width:100%;" class="d-flex"><input style="width:80%;" id="new-room" type="text" placeholder="create a room"><input style="width:20%;" type="submit" id="create-room" value="OK"></div><div id="room-list"></div>';
        $('#rooms').append(createRoomInput);
      }
      if(json.type == 'username'){
        let content = "<div class='col col-2'><div id='rooms'><h4>Room List</h4><div></div></div></div><div class='col col-10'><div class='chat' id='chat'></div></div>";
        chat_content.html(content);
        let bar = '<div class="col col-12 d-flex"><div class="col col-10"><input type="text" class="message" id="message" /></div><div class="col col-2"><input type="submit" class="send-msg" id="send-msg" value="SEND"></div></div>';
        chat_bar.html(bar);
        let createRoomInput = '<div style="width:100%;" class="d-flex"><input style="width:80%;" id="new-room" type="text" placeholder="create a room"><input style="width:20%;" type="submit" id="create-room" value="OK"></div><div id="room-list"></div>';
        $('#rooms').append(createRoomInput);

        user = { 'username' : json.data['username'], 'color' : json.data['color'] };

        $('#create-room').click(function(e){
          e.preventDefault();
          if ($('#new-room').val() == '') return;
          let room_code = prompt('create room code :');

          if(!room_code) return;
          connection.send(JSON.stringify({ new_room: $('#new-room').val(), room_code: room_code, user : user }));
          $('#new-room').val('');
        });
      }
      if(json.type == 'message'){
        let msg = '<div class="col col-12 d-flex" style="width:100%;"><div class="d-flex"><div style="background-color:'+json.data.color+';" class="avatar"><p>'+json.data.username[0].toUpperCase()+json.data.username[1].toUpperCase()+'</p></div><p style="margin:0.5em;">'+json.data['message']+'</p></div><div style="width: 100%;text-align: right;"><p style="margin:0.5em;">'+json.data.time+'</p><div></div>';
        if(json.data.chat == 'message') $('#chat').append(msg);
        else {
          let chatId = json.data.chat.split('-');
          chatId = 'chat-'+chatId[1];
          $('#'+chatId).append(msg);
        }
      }
      if (json.type == 'history') {
        for (let i=0; i < json.data.length; i++) {
          let msg = '<div class="col col-12 d-flex" style="width:100%;"><div class="d-flex"><div style="background-color:'+json.data[i].color+';" class="avatar"><p>'+json.data[i].username[0].toUpperCase()+user.username[1].toUpperCase()+'</p></div><p style="margin:0.5em;">'+json.data[i].message+'</p></div><div style="width: 100%;text-align: right;"><p style="margin:0.5em;">'+json.data[i].time+'</p><div></div>';
          $('#chat').append(msg);
        }
      }
      if (json.type == 'new_room') {
          let room = '<div id="'+json.data.data.name+'" class="col col-12 d-flex room-div" style="width:100%;"><p>'+json.data.data.name+'</p></div>';
          $('#room-list').append(room);
      }
      if (json.type == 'join_room') {
          let roomcontent = "<div class='col col-2'><div class='room-players' id='players-"+json.data.data.name+"'><p class='exit'>Exit</p><p class='start'>Start</p><h4>"+json.data.data.name+" Players :</h4><div></div></div></div><div class='col col-10'><div class='chat' id='chat-"+json.data.data.name+"'></div></div>";
          let roombar = '<div class="col col-12 d-flex"><div class="col col-10"><input type="text" class="message" id="message-'+json.data.data.name+'" /></div><div class="col col-2"><input type="submit" class="send-msg" id="send-msg-'+json.data.data.name+'" value="SEND"></div></div>';
          chat_content.html(roomcontent);
          chat_bar.html(roombar);
          //$('#players-'+json.data.data.name+'>div').html('');
          json.data.data.users.forEach(function(el){
            $('#players-'+json.data.data.name+'>div').append('<p>'+el+'</p>');
          });
      }
      $('.send-msg').click(function(e){
        e.preventDefault();
        if ($(this).parent().parent().find('input[class="message"]').val() == '') return;
        connection.send(JSON.stringify({ message: $(this).parent().parent().find('input[class="message"]').val(), user : user, chat : $(this).parent().parent().find('input[class="message"]').attr('id') }));
        $(this).parent().parent().find('input[class="message"]').val('');
      });
      $('[id^="message"]').keydown(function(e) {
        if(e.keyCode === 13) {
          if ($(this).val() == '') return;
          connection.send(JSON.stringify({ message: $(this).val(), user : user, chat : $(this).attr('id')}));
          $(this).val('');
        }
      });
      if (json.type == 'rooms') {
        for (let i=0; i < json.data.length; i++) {
          let rooms = '<div id="'+json.data[i].data.name+'" class="col col-12 d-flex room-div" style="width:100%;"><p>'+json.data[i].data.name+'</p></div>';
          $('#room-list').append(rooms);
        }
      }
      $('.room-div').click(function(e){
        e.preventDefault();
        let room_id = $(this).attr('id');
        let code = prompt("room code :", "");
        connection.send(JSON.stringify({ room_id: room_id, room_code : code }));
      });
      if(json.type == 'ask_join') {
        if(!json.data.id) alert(json.data.res);
        else {
          connection.send(JSON.stringify({ join_room: json.data.id, user : user }));
        }
      }
      $('.exit').click(function(e){
        e.preventDefault();
        roomId = $(this).closest('div[class="room-players"]').attr('id').split('-');
        connection.send(JSON.stringify({ exit_room: roomId[1], user : user }));
      });

    } catch (e) {
      console.log(e)
      return;
    }
    // handle incoming message
  };

  let username_input = $('#username');
  username_input.keydown(function(e) {
    if(e.keyCode === 13) {
      let username = $(this).val();
      if (!username) {
        return;
      }
      connection.send(JSON.stringify({ username: username }));

    }
  });

});

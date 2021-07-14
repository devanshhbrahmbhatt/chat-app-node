const socket = io();


const $messageform = document.querySelector('#message-form');
const $messageformbutton = $messageform.querySelector('button');
const $messageforminput = $messageform.querySelector('input');
const $sendlocationbutton = document.querySelector('#geolocation')
const $message = document.querySelector('#message');
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebartemplate = document.querySelector('#sidebartemplate').innerHTML;
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    // New message element
    const $newMessage = $message.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $message.offsetHeight

    // Height of messages container
    const containerHeight = $message.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $message.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $message.scrollTop = $message.scrollHeight
    }
    
}
socket.on('locationmessage', (message) => {
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $message.insertAdjacentHTML('beforeend', html)
    autoscroll()
});
socket.on("roomdata", ({ room, users }) => {
    const html = Mustache.render(sidebartemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html
    console.log(room)
})
socket.on("message", (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $message.insertAdjacentHTML('beforeend', html);
    autoscroll()
});
$messageform.addEventListener('submit', (e) => {
    e.preventDefault()
   
    $messageformbutton.setAttribute('disabled', 'disabled');

    const message = e.target.elements.message.value;
    socket.emit('sendmessage', message, (error) => {
        $messageformbutton.removeAttribute('disabled')
        $messageforminput.value = ''
        $messageforminput.focus()
        if (error) {
            return console.log(error)
        }
       
    });
});
$sendlocationbutton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert("geolocation is not available")
    }
    $sendlocationbutton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendlocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log("location shared");
            $sendlocationbutton.removeAttribute('disabled')

        })
    });
})
socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }

})
console.log(username)

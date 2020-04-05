const socket = io()

//elements
const $chatForm = document.querySelector('#chatForm')
const $chatInput = $chatForm.querySelector('input')
const $chatMsgShowDiv = document.querySelector('#messages')
const $btnLocation = document.querySelector('#share-loc')
const $sidebarDiv = document.querySelector('#room-sidebar')


//template
const messageTemplate = document.querySelector('#Message-Template').innerHTML
const locationTemplate = document.querySelector('#Location-Template').innerHTML
const broadcastTemplate = document.querySelector('#Broadcast-Template').innerHTML
const sidebarTemplate = document.querySelector('#Sidebar-Template').innerHTML

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})



const autoscroll = () => {
    // New message element
    const $newMessage = $chatMsgShowDiv.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $chatMsgShowDiv.offsetHeight

    // Height of messages container
    const containerHeight = $chatMsgShowDiv.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $chatMsgShowDiv.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $chatMsgShowDiv.scrollTop = $chatMsgShowDiv.scrollHeight
    }
}

$chatForm.addEventListener('submit', (e) => {
    e.preventDefault()
    if($chatInput.value != ''){
        // const msgHtml = Mustache.render(messageTemplate, {
        //     message: $chatInput.value 
        // })
        //$chatMsgShowDiv.insertAdjacentHTML('beforeend', msgHtml)
        socket.emit('push', $chatInput.value, (status) => {
            if(status)
                console.log('Delivered')
                else
                console.log('Failed')
        })     
    }
    $chatInput.value  = ''
    $chatInput.focus()
})

//const addmessage = ()

$btnLocation.addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('Location service is not supported')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        if(position.coords.latitude != undefined){
            socket.emit('userLocation', {
                latitude: position.coords.latitude, 
                longitude: position.coords.longitude
            }, (status) => {
                if(status)
                console.log('Shared Location')
                else
                console.log('Failed to share Location')
            })
        }
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error){
        alert(error)
        window.location = '/'
    }
})


//Render Messages

socket.on('get', (message) => {
    const msgHtml = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $chatMsgShowDiv.insertAdjacentHTML('beforeend', msgHtml)
    autoscroll()
})

socket.on('locationMessage', (location) => {
    const locHtml = Mustache.render(locationTemplate, {
        username: location.username,
        url: location.url,
        createdAt: moment(location.createdAt).format('h:mm a')
    })
    $chatMsgShowDiv.insertAdjacentHTML('beforeend', locHtml)
    autoscroll()
})

socket.on('broadcastMessage', (message) => {
    const msgHtml = Mustache.render(broadcastTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $chatMsgShowDiv.insertAdjacentHTML('beforeend', msgHtml)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const sidebarHtml = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $sidebarDiv.innerHTML = sidebarHtml
})

socket.on('Message', (msg) => {
    console.log(msg)
})
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(
      '/sw.js'
    );
}

// ################## Menu Selection #######################

// if there is no saved selection save one
if (!localStorage.getItem('settingMenuSelected')) {
    localStorage.setItem('settingMenuSelected', '1');
}

// on load activate the saved selection
document.getElementById(localStorage.getItem('settingMenuSelected')).classList.add('active');
document.getElementById(`c${localStorage.getItem('settingMenuSelected')}`).classList.remove('none');

document.querySelectorAll('#menuSelector > li').forEach(li => {
    li.addEventListener('click', event => {

        document.getElementById(localStorage.getItem('settingMenuSelected')).classList.remove('active');
        document.getElementById(li.id).classList.add('active');

        document.getElementById(`c${localStorage.getItem('settingMenuSelected')}`).classList.add('none');
        document.getElementById(`c${li.id}`).classList.remove('none');
        
        localStorage.setItem('settingMenuSelected', `${li.id}`);
    })
})

// #########################################################
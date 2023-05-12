document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', (event) => {

        document.getElementById('submitLoader').classList.remove('none');
        
    })
})


document.querySelectorAll('a[scope="serverAction"]').forEach(button => {
    button.addEventListener('click', event => {

        document.getElementById('submitLoader').classList.remove('none');
  
    })
})
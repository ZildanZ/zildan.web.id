document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

const slider = document.querySelector('.certificate-slider');
const prevBtnCert = document.getElementById('prevCert');
const nextBtnCert = document.getElementById('nextCert');

nextBtnCert.addEventListener('click', () => {
    slider.scrollBy({ left: 500, behavior: 'smooth' });
});

prevBtnCert.addEventListener('click', () => {
    slider.scrollBy({ left: -500, behavior: 'smooth' });
});

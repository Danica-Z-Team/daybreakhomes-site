// Daybreak Homes | Zander Real Estate Team
// Minimal vanilla JS: mobile nav toggle + footer year. No frameworks, keeps pages fast.

document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.primary-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Contact form -> /api/contact (Vercel serverless function) -> Follow Up Boss
  var contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var submitBtn = contactForm.querySelector('button[type="submit"]');
      var originalLabel = submitBtn.textContent;
      var payload = {
        name: contactForm.name.value,
        email: contactForm.email.value,
        phone: contactForm.phone.value,
        message: contactForm.message.value,
        website: contactForm.website.value // honeypot, should always be empty
      };

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          if (!response.ok) { throw new Error('Request failed'); }
          contactForm.innerHTML =
            '<p style="font-size:1.1rem;">Thanks' +
            (payload.name ? ', ' + payload.name : '') +
            '! We got your message and will follow up personally, usually within one business day. ' +
            'Need us sooner? Call <a href="tel:8014462662">801-446-2662</a>.</p>';
        })
        .catch(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
          alert('Something went wrong sending your message. Please call or text us directly at 801-446-2662.');
        });
    });
  }
});

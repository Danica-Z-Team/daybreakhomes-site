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

  // Google reviews -> /api/reviews (Vercel serverless function) -> Google Places API
  var reviewsEl = document.getElementById('google-reviews');
  if (reviewsEl) {
    function starString(rating) {
      var rounded = Math.round(rating || 0);
      return '&#9733;'.repeat(Math.max(0, Math.min(5, rounded))) + '&#9734;'.repeat(5 - Math.max(0, Math.min(5, rounded)));
    }
    function escapeHtml(str) {
      var div = document.createElement('div');
      div.textContent = str || '';
      return div.innerHTML;
    }

    fetch('/api/reviews')
      .then(function (response) {
        if (!response.ok) { throw new Error('Request failed'); }
        return response.json();
      })
      .then(function (data) {
        if (!data.reviews || data.reviews.length === 0) {
          throw new Error('No reviews returned');
        }

        var headerHtml = '';
        if (data.rating) {
          headerHtml =
            '<div class="reviews-header">' +
            '<div class="stars">' + starString(data.rating) + '</div>' +
            '<div class="rating-line">' + data.rating.toFixed(1) + ' out of 5' +
            (data.total ? ', based on ' + data.total + ' Google reviews' : '') +
            (data.mapsUrl ? ' &mdash; <a href="' + data.mapsUrl + '" target="_blank" rel="noopener">see them all on Google</a>' : '') +
            '</div></div>';
        }

        var cardsHtml = data.reviews.map(function (r) {
          var avatar = r.photo
            ? '<img src="' + r.photo + '" alt="" loading="lazy">'
            : '<div class="avatar-fallback">' + escapeHtml((r.author || 'G').charAt(0)) + '</div>';
          return (
            '<div class="review-card">' +
            '<div class="stars">' + starString(r.rating) + '</div>' +
            '<p>&ldquo;' + escapeHtml(r.text) + '&rdquo;</p>' +
            '<div class="review-author">' + avatar +
            '<div><div class="author-name">' + escapeHtml(r.author) + '</div>' +
            '<div class="review-time">' + escapeHtml(r.relativeTime) + '</div></div></div>' +
            '</div>'
          );
        }).join('');

        reviewsEl.innerHTML = headerHtml + '<div class="reviews-grid">' + cardsHtml + '</div>';
      })
      .catch(function () {
        reviewsEl.innerHTML =
          '<p class="reviews-fallback">Read our reviews directly on <a href="https://www.google.com/search?q=Zander+Real+Estate+Team+Daybreak+reviews" target="_blank" rel="noopener">Google</a>.</p>';
      });
  }

  // Contact form -> /api/contact (Vercel serverless function) -> Follow Up Boss
  var contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.form_ts.value = String(Date.now()); // when the form was shown; server rejects instant submits
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var submitBtn = contactForm.querySelector('button[type="submit"]');
      var originalLabel = submitBtn.textContent;
      var tokenField = contactForm.querySelector('[name="cf-turnstile-response"]');
      var payload = {
        name: contactForm.name.value,
        email: contactForm.email.value,
        phone: contactForm.phone.value,
        message: contactForm.message.value,
        company_website: contactForm.company_website.value, // honeypot, should always be empty
        form_ts: contactForm.form_ts.value,
        turnstileToken: tokenField ? tokenField.value : ''
      };
      if (!payload.turnstileToken) {
        alert('Please wait a moment for the security check to finish, then try again.');
        return;
      }

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
          if (window.turnstile) { window.turnstile.reset(contactForm.querySelector('.cf-turnstile')); } // tokens are single-use
          alert('Something went wrong sending your message. Please call or text us directly at 801-446-2662.');
        });
    });
  }
});

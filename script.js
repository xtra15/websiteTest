// Ilham Shirts - Interactive JavaScript

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Modal functionality
    const modal = document.getElementById('modal');
    const preorderBtns = document.querySelectorAll('#preorder-btn, #hero-preorder-btn');
    const closeBtn = document.querySelector('.close');
    const form = modal.querySelector('form');

    // Add event listeners to both preorder buttons
    preorderBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            modal.style.display = 'block';
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }

    // Close modal if clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Form submit handler
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            alert('Thank you for your interest in Opposite Shirts! We will contact you soon with pre-order details.');
            modal.style.display = 'none';
            form.reset();
        });
    }

    // Smooth scrolling for nav links
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Shirt image toggle functionality
    const shirtToggleBtn = document.getElementById('shirt-toggle');
    const frontShirt = document.querySelector('.about-image.front');
    const backShirt = document.querySelector('.about-image.back');
    
    if (shirtToggleBtn) {
        shirtToggleBtn.addEventListener('click', function() {
            if (frontShirt.style.opacity === '0') {
                // Currently showing back, switch to front
                frontShirt.style.opacity = '1';
                backShirt.style.opacity = '0';
                shirtToggleBtn.textContent = 'View Back';
            } else {
                // Currently showing front, switch to back
                frontShirt.style.opacity = '0';
                backShirt.style.opacity = '1';
                shirtToggleBtn.textContent = 'View Front';
            }
        });
    }
});

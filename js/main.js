document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    let isMenuOpen = false;

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        mobileMenu.classList.toggle('active');
        navLinks.classList.toggle('active');
        document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    }

    mobileMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleMenu();
    });

    // Close menu when clicking on a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (isMenuOpen) {
                toggleMenu();
            }
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (isMenuOpen && !navLinks.contains(e.target) && !mobileMenu.contains(e.target)) {
            toggleMenu();
        }
    });

    // Prevent menu close when clicking inside nav
    navLinks.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Smooth Scrolling for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Header Scroll Effect
    const header = document.querySelector('.header');
    let lastScroll = 0;
    const scrollThreshold = 5;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (Math.abs(currentScroll - lastScroll) < scrollThreshold) return;

        if (currentScroll <= 0) {
            header.classList.remove('scroll-up');
            header.classList.remove('scroll-down');
            return;
        }

        if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
            // Scrolling down
            header.classList.remove('scroll-up');
            header.classList.add('scroll-down');
        } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
            // Scrolling up
            header.classList.remove('scroll-down');
            header.classList.add('scroll-up');
        }

        lastScroll = currentScroll;
    });

    // Form Validation
    const contactForm = document.querySelector('.contato-form');
    
    if (contactForm) {
        const validateInput = (input) => {
            if (input.required && !input.value.trim()) {
                input.classList.add('error');
                return false;
            }
            if (input.type === 'email' && input.value) {
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(input.value)) {
                    input.classList.add('error');
                    return false;
                }
            }
            input.classList.remove('error');
            return true;
        };

        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const inputs = this.querySelectorAll('input, textarea');
            let isValid = true;

            inputs.forEach(input => {
                if (!validateInput(input)) {
                    isValid = false;
                }
            });

            if (!isValid) {
                alert('Por favor, preencha todos os campos obrigatórios corretamente.');
                return;
            }

            alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
            this.reset();
        });

        // Real-time validation
        contactForm.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', function() {
                validateInput(this);
            });

            input.addEventListener('blur', function() {
                validateInput(this);
            });
        });
    }

    // Email integration handling
    async function handleSubmit(event) {
        event.preventDefault();
        
        const form = document.getElementById('contactForm');
        const submitButton = form.querySelector('.submit-button');
        const buttonText = submitButton.querySelector('.button-text');
        const loadingSpinner = submitButton.querySelector('.loading-spinner');
        
        // Get form data
        const formData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            message: document.getElementById('message').value
        };
        
        try {
            // Show loading state
            buttonText.style.display = 'none';
            loadingSpinner.style.display = 'block';
            submitButton.disabled = true;
            
            // Request Google OAuth consent
            const provider = new google.accounts.oauth2.OAuth2({
                client_id: 'YOUR_GOOGLE_CLIENT_ID', // You'll need to replace this with your actual Google Client ID
                scope: 'https://www.googleapis.com/auth/gmail.send',
                callback: async (response) => {
                    if (response.error) {
                        throw new Error('Autorização negada');
                    }
                    
                    // Create email content
                    const emailContent = `
                        Nome: ${formData.name}
                        Telefone: ${formData.phone}
                        Mensagem: ${formData.message}
                    `;
                    
                    // Send email using Gmail API
                    const emailData = {
                        to: 'du.claza@gmail.com',
                        subject: 'Novo contato do site',
                        text: emailContent
                    };
                    
                    // Make API request to send email
                    await sendEmail(response.access_token, emailData);
                    
                    // Show success message
                    Swal.fire({
                        title: 'Sucesso!',
                        text: 'Sua mensagem foi enviada com sucesso!',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });
                    
                    // Reset form
                    form.reset();
                }
            });
            
            // Prompt for Google account selection
            provider.requestAccessToken();
            
        } catch (error) {
            // Show error message
            Swal.fire({
                title: 'Erro!',
                text: 'Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            console.error('Error:', error);
        } finally {
            // Reset button state
            buttonText.style.display = 'block';
            loadingSpinner.style.display = 'none';
            submitButton.disabled = false;
        }
    }

    // Function to send email using Gmail API
    async function sendEmail(accessToken, emailData) {
        const email = btoa(
            `To: ${emailData.to}\r\n` +
            `Subject: ${emailData.subject}\r\n\r\n` +
            `${emailData.text}`
        ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        
        const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                raw: email
            })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao enviar e-mail');
        }
        
        return response.json();
    }

    // Lazy Loading Images with Intersection Observer
    const lazyLoadImages = () => {
        const imageOptions = {
            root: null,
            threshold: 0.1,
            rootMargin: '50px'
        };

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('fade-in');
                    observer.unobserve(img);
                }
            });
        }, imageOptions);

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    };

    lazyLoadImages();

    // Animation on Scroll
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.servico-card, .projeto-card, .sustentabilidade-item');
        const animationOptions = {
            threshold: 0.1,
            rootMargin: '50px'
        };

        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    animationObserver.unobserve(entry.target);
                }
            });
        }, animationOptions);

        elements.forEach(element => {
            animationObserver.observe(element);
        });
    };

    animateOnScroll();

    // Animação dos números estatísticos
    function animateNumbers() {
        const stats = document.querySelectorAll('.stat-item h3');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const targetNumber = parseInt(target.textContent);
                    let count = 0;
                    const duration = 2000; // 2 segundos
                    const increment = targetNumber / (duration / 16); // 60fps

                    function updateCount() {
                        count += increment;
                        if (count < targetNumber) {
                            target.textContent = Math.round(count);
                            requestAnimationFrame(updateCount);
                        } else {
                            target.textContent = targetNumber;
                        }
                    }

                    updateCount();
                    observer.unobserve(target);
                }
            });
        }, {
            threshold: 0.5
        });

        stats.forEach(stat => observer.observe(stat));
    }

    animateNumbers();
});

// Add CSS class for animations and mobile menu
const style = document.createElement('style');
style.textContent = `
    .servico-card, .projeto-card, .sustentabilidade-item {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.5s ease, transform 0.5s ease;
    }

    .servico-card.animate, .projeto-card.animate, .sustentabilidade-item.animate {
        opacity: 1;
        transform: translateY(0);
    }

    .header.scroll-down {
        transform: translateY(-100%);
    }

    .header.scroll-up {
        transform: translateY(0);
    }

    .header {
        transition: transform 0.3s ease;
    }

    .fade-in {
        animation: fadeIn 0.5s ease-in;
    }

    @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
    }

    .error {
        border-color: #ff3860 !important;
    }

    .nav-links.active {
        opacity: 1;
        visibility: visible;
    }
`;
document.head.appendChild(style);

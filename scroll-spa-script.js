class ScrollSPAPromptSite {
    constructor() {
        this.totalSlides = 9;
        this.currentSlide = 0;
        this.scrollContainer = document.querySelector('.scroll-container');
        this.slides = document.querySelectorAll('.prompt-slide');
        this.isScrolling = false;
        
        this.initializeCopyButtons();
        this.setupNavigation();
        this.setupSwipeGestures();
        this.setupScrollTracking();
        this.setupKeyboardNavigation();
    }

    initializeCopyButtons() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-button')) {
                this.copyToClipboard(e.target);
            }
        });
    }

    async copyToClipboard(button) {
        const slide = button.closest('.prompt-slide');
        const promptText = slide.querySelector('.prompt-text').textContent;
        
        try {
            await navigator.clipboard.writeText(promptText.trim());
            this.showCopySuccess(button);
            this.showNotification('Copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            this.fallbackCopy(promptText);
            this.showCopySuccess(button);
            this.showNotification('Copied to clipboard!');
        }
    }

    fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Fallback copy failed: ', err);
        }
        
        document.body.removeChild(textArea);
    }

    showCopySuccess(button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    setupNavigation() {
        // Dot navigation
        document.querySelectorAll('.nav-dot').forEach((dot, index) => {
            dot.addEventListener('click', () => {
                this.scrollToSlide(index);
            });
        });

        // Prev/Next buttons (per section)
        document.querySelectorAll('.nav-button.prev').forEach(btn => {
            btn.addEventListener('click', () => {
                this.scrollToSlide(this.currentSlide - 1);
            });
        });

        document.querySelectorAll('.nav-button.next').forEach(btn => {
            btn.addEventListener('click', () => {
                this.scrollToSlide(this.currentSlide + 1);
            });
        });
    }

    setupSwipeGestures() {
        // Removed horizontal swipe gestures to avoid browser scroll conflicts
        // Vertical scrolling with scroll-snap works naturally
    }

    setupScrollTracking() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    const slideIndex = parseInt(entry.target.dataset.slide);
                    if (slideIndex !== this.currentSlide) {
                        this.currentSlide = slideIndex;
                        this.updateNavigation();
                        this.updateURL();
                    }
                }
            });
        }, {
            root: this.scrollContainer,
            rootMargin: '0px',
            threshold: [0.5]
        });

        this.slides.forEach(slide => {
            observer.observe(slide);
        });
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (this.isScrolling) return;
            
            switch(e.key) {
                case 'ArrowUp':
                case 'PageUp':
                    e.preventDefault();
                    this.scrollToSlide(this.currentSlide - 1);
                    break;
                case 'ArrowDown':
                case 'PageDown':
                case ' ':
                    e.preventDefault();
                    this.scrollToSlide(this.currentSlide + 1);
                    break;
                case 'Home':
                    e.preventDefault();
                    this.scrollToSlide(0);
                    break;
                case 'End':
                    e.preventDefault();
                    this.scrollToSlide(this.totalSlides - 1);
                    break;
            }
        });
    }

    scrollToSlide(slideIndex) {
        if (slideIndex < 0 || slideIndex >= this.totalSlides || slideIndex === this.currentSlide) {
            return;
        }

        this.isScrolling = true;
        this.currentSlide = slideIndex;

        const targetSlide = this.slides[slideIndex];
        if (targetSlide) {
            targetSlide.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }

        this.updateNavigation();
        this.updateURL();

        // Reset scrolling flag after animation
        setTimeout(() => {
            this.isScrolling = false;
        }, 1000);
    }

    updateNavigation() {
        // Update dots
        document.querySelectorAll('.nav-dot').forEach((dot, index) => {
            if (index === this.currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        // Update prev/next button states for all sections
        document.querySelectorAll('.nav-button.prev').forEach(btn => {
            btn.disabled = this.currentSlide === 0;
        });

        document.querySelectorAll('.nav-button.next').forEach(btn => {
            btn.disabled = this.currentSlide === this.totalSlides - 1;
        });
    }

    updateURL() {
        // Update URL fragment for bookmarking
        const newHash = `#slide-${this.currentSlide + 1}`;
        if (window.location.hash !== newHash) {
            history.replaceState(null, null, newHash);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.scrollSpaPromptSite = new ScrollSPAPromptSite();
    
    // Handle initial hash
    const hash = window.location.hash;
    if (hash) {
        const match = hash.match(/#slide-(\d+)/);
        if (match) {
            const slideNum = parseInt(match[1]) - 1; // Convert to 0-based index
            if (slideNum >= 0 && slideNum < 9) {
                setTimeout(() => {
                    window.scrollSpaPromptSite.scrollToSlide(slideNum);
                }, 100);
            }
        }
    }
});

const { createApp } = Vue;

createApp({
    data() {
        return {
            form: {
                fullName: '',
                dob: '',
                gender: '',
                totalVisitors: null,
                totalChildren: null,
                accommodation: '',
                cardholderName: '',
                cardNumber: '',
                expirationDate: '',
                cvv: '',
            },
            errors: {
                fullName: '',
                dob: '',
                gender: '',
                selectedPlaces: '',
                totalVisitors: '',
                totalChildren: '',
                accommodation: '',
                cardholderName: '',
                cardNumber: '',
                expirationDate: '',
                cvv: '',
            },
            generalError: '',
            places: [],
            isLoadingPlaces: true,
            placesError: '',
            selectedPlaces: [],
            accommodationOptions: [
                { value: 'none', text: 'No accommodation needed' },
                { value: 'forest-view', text: 'Forest View Hotel' },
                { value: 'totoro-inn', text: 'Totoro Family Inn' },
                { value: 'witch-valley', text: 'Witch Valley Guesthouse' },
                { value: 'luxury-ghibli', text: 'Luxury Ghibli Resort' },
            ],
            showSummary: false,
            fallbackImageBase: 'https://placehold.co/400x250',
        };
    },

    mounted() {
        this.loadPlaces();
    },

    methods: {
        // load places from json file
        async loadPlaces() {
            this.isLoadingPlaces = true;
            this.placesError = '';
            try {
                const response = await fetch('./ghibli_park.json');
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const data = await response.json();
                if (!Array.isArray(data) || data.length === 0) {
                    throw new Error('No places data available.');
                }

                // adjust image paths (remove .jpg if needed)
                this.places = data.map(place => {
                    const originalImage = place.image || '';
                    const noExtImage = originalImage.replace(/\.jpg$/i, '');
                    return {
                        ...place,
                        image: noExtImage,
                        originalImage: originalImage
                    };
                });

            } catch (error) {
                console.error('load error:', error);
                this.placesError = 'Failed to load places. Please refresh the page.';
                this.places = [];
            } finally {
                this.isLoadingPlaces = false;
            }
        },

        // fallback for broken images
        handleImageError(event, place) {
            if (!event.target) return;

            // first try the original path with .jpg
            if (event.target.src.includes(place.image) && place.originalImage && place.originalImage !== place.image) {
                event.target.src = place.originalImage;
                return;
            }

            // then use placeholder
            const text = encodeURIComponent(place.name || 'Ghibli Park');
            event.target.src = `${this.fallbackImageBase}/e8f5e9/3d6b4f?text=${text}`;
            event.target.onerror = null;
        },

        // toggle a place selection
        togglePlace(placeId) {
            const index = this.selectedPlaces.indexOf(placeId);
            if (index === -1) {
                this.selectedPlaces.push(placeId);
            } else {
                this.selectedPlaces.splice(index, 1);
            }
            if (this.errors.selectedPlaces) {
                this.errors.selectedPlaces = '';
            }
        },

        isPlaceSelected(placeId) {
            return this.selectedPlaces.includes(placeId);
        },

        getPlaceNameById(placeId) {
            const place = this.places.find(p => p.id === placeId);
            return place ? place.name : 'Unknown Place';
        },

        getAccommodationText() {
            if (!this.form.accommodation) {
                return 'Not specified';
            }
            const opt = this.accommodationOptions.find(o => o.value === this.form.accommodation);
            return opt ? opt.text : this.form.accommodation;
        },

        maskedCardNumber() {
            const num = this.form.cardNumber.replace(/\s/g, '');
            if (num.length >= 4) {
                return num.slice(-4);
            }
            return num || '----';
        },

        formatDate(dateStr) {
            if (!dateStr) {
                return 'Not provided';
            }
            try {
                const d = new Date(dateStr + 'T00:00:00');
                return d.toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
            } catch (e) {
                return dateStr;
            }
        },

        clearErrors() {
            for (let k in this.errors) {
                this.errors[k] = '';
            }
            this.generalError = '';
        },

        // validate all form fields
        validateForm() {
            let valid = true;

            if (!this.form.fullName || this.form.fullName.trim() === '') {
                this.errors.fullName = 'Full Name is required.';
                valid = false;
            }
            if (!this.form.dob) {
                this.errors.dob = 'Date of Birth is required.';
                valid = false;
            }
            if (!this.form.gender) {
                this.errors.gender = 'Please select a gender.';
                valid = false;
            }
            if (this.selectedPlaces.length === 0) {
                this.errors.selectedPlaces = 'Please select at least one park location.';
                valid = false;
            }
            if (this.form.totalVisitors === null || this.form.totalVisitors === '' || this.form.totalVisitors < 1) {
                this.errors.totalVisitors = 'Total number of visitors is required (minimum 1).';
                valid = false;
            }
            if (this.form.totalChildren === null || this.form.totalChildren === '' || this.form.totalChildren < 0) {
                this.errors.totalChildren = 'Total number of children is required (minimum 0).';
                valid = false;
            }
            if (!this.form.accommodation) {
                this.errors.accommodation = 'Please select an accommodation option.';
                valid = false;
            }
            if (!this.form.cardholderName || this.form.cardholderName.trim() === '') {
                this.errors.cardholderName = 'Cardholder name is required.';
                valid = false;
            }
            if (!this.form.cardNumber || this.form.cardNumber.trim() === '') {
                this.errors.cardNumber = 'Card number is required.';
                valid = false;
            }
            if (!this.form.expirationDate) {
                this.errors.expirationDate = 'Expiration date is required.';
                valid = false;
            }
            if (!this.form.cvv || this.form.cvv.trim() === '') {
                this.errors.cvv = 'CVV is required.';
                valid = false;
            }

            return valid;
        },

        // handle generate button click
        generateItinerary() {
            this.clearErrors();
            this.showSummary = false;

            if (!this.validateForm()) {
                this.generalError = 'There are mandatory items pending to be filled. Please complete the required fields.';
                this.$nextTick(() => {
                    const el = document.querySelector('.alert-danger') || document.querySelector('.error-message');
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
            } else {
                this.generalError = '';
                this.showSummary = true;
                this.$nextTick(() => {
                    const summary = document.querySelector('.summary-card');
                    if (summary) {
                        summary.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            }
        },
    },
}).mount('#app');
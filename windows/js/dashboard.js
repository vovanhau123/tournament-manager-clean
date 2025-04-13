/**
 * dashboard.js
 * Main file for managing dashboard, using the separated modules
 */

document.addEventListener('DOMContentLoaded', async function() {
    const stepsContainer = document.querySelector('.steps-container');
    const nextBtn = document.querySelector('.next-btn');
    const navigation = document.querySelector('.navigation');
    let currentStep = 1;
    const totalSteps = 3; // Keep it as 3 because we still have 3 steps: Tournament Info, Reentries and Blind Structure

    // Variable for storing background image URL
    let backgroundImageUrl = localStorage.getItem('tournamentBackgroundImage') || '';

    // Add Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'back-btn';
    backBtn.textContent = 'Back';
    navigation.insertBefore(backBtn, nextBtn);
    backBtn.style.display = 'none';

    // Get TournamentInfo instance
    const tournamentInfo = window.tournamentInfo;

    // Check reentries and addons status
    async function checkReentriesAddonsStatus() {
        try {
            const reentriesData = await window.api.getReentriesData();
            console.log('Reentries data:', reentriesData);
            return reentriesData && reentriesData.allow_reentry === 1 && reentriesData.allow_addon === 1;
        } catch (error) {
            console.error('Error checking reentries/addons:', error);
            return false;
        }
    }

    // Display current step
    function showStep(stepNumber) {
        // Hide all steps and form content
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
            const formContent = step.querySelector('.form-content');
            if (formContent) {
                formContent.classList.add('hidden');
            }
        });

        // Display current step
        const currentStep = document.querySelector(`.step:nth-child(${stepNumber})`);
        if (currentStep) {
            currentStep.classList.add('active');
            const formContent = currentStep.querySelector('.form-content');
            if (formContent) {
                formContent.classList.remove('hidden');
            }

            // Display other form elements
            const forms = currentStep.querySelectorAll('form');
            forms.forEach(form => {
                form.style.display = 'block';
            });

            // Display input, select and other elements
            const formElements = currentStep.querySelectorAll('input, select, textarea, .form-group, .form-control');
            formElements.forEach(element => {
                element.style.display = '';
            });
        }
    }

    // Handle Next button click event
    nextBtn.addEventListener('click', async function() {
        const currentStep = document.querySelector('.step.active');
        const stepIndex = Array.from(document.querySelectorAll('.step')).indexOf(currentStep) + 1;

        if (stepIndex === totalSteps) {
            // When at the last step, create dashboard
            await initializeDashboard();
        }
    });

    // Handle Back button click event
    backBtn.addEventListener('click', function() {
        // Remove dashboard if displayed
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.remove();
            nextBtn.style.display = 'block';
        }
    });

    /**
     * Initialize dashboard
     */
    async function initializeDashboard() {
        try {
            // Check reentries and addons status
            const showAddonsButton = await checkReentriesAddonsStatus();

            // Create dashboard UI
            const dashboardUI = new window.DashboardUI();
            const dashboard = await dashboardUI.createDashboard(showAddonsButton);
            
            // Add dashboard to DOM
            stepsContainer.parentNode.insertBefore(dashboard, stepsContainer.nextSibling);
            dashboard.classList.add('active');
            
            // Hide "Next" button
            nextBtn.style.display = 'none';
            
            // Initialize and update player list
            const dashboardPlayers = new window.DashboardPlayers();
            const standingsBody = dashboard.querySelector('.standings-body');
            await dashboardPlayers.updatePlayersList(standingsBody);
            
            // Initialize and update statistics
            const dashboardStats = new window.DashboardStats();
            await dashboardStats.updateCounterDisplay(dashboard);
            dashboardStats.attachCounterEvents(dashboard);
            
            // Initialize and update points
            const dashboardPoints = new window.DashboardPoints();
            await dashboardPoints.updatePointsDisplay(dashboard);
            dashboardPoints.attachPointsEvents(dashboard);
            
            // Initialize and attach events for control buttons
            const dashboardControls = new window.DashboardControls();
            dashboardControls.attachControlEvents(dashboard);
            
            // Add background customization (color, image, video)
            addBackgroundCustomizer(dashboard);
            
            // Apply background image from localStorage if available
            if (backgroundImageUrl) {
                applyBackgroundImage(backgroundImageUrl);
            }
        } catch (error) {
            console.error('Error initializing dashboard:', error);
        }
    }

    /**
     * Add background customization (color, image, video)
     * @param {HTMLElement} dashboard - Dashboard container
     */
    function addBackgroundCustomizer(dashboard) {
        // Create container for background options
        const customizeSection = document.createElement('div');
        customizeSection.className = 'background-customize-section';
        customizeSection.style.marginTop = '20px';

        // Create main container and add to dashboard
        const container = document.createElement('div');
        container.className = 'background-customize-container';
        container.style.background = '#1e293b';
        container.style.borderRadius = '12px';
        container.style.padding = '20px';
        container.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        customizeSection.appendChild(container);

        // Create title
        const header = document.createElement('div');
        header.className = 'card-header';
        header.style.marginBottom = '15px';
        header.style.paddingBottom = '15px';
        header.style.borderBottom = '1px solid #475569';
        header.innerHTML = '<h3>Background Customization</h3>';
        container.appendChild(header);

        // Create tabs container
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'tabs-container';
        tabsContainer.style.display = 'flex';
        tabsContainer.style.borderBottom = '1px solid #475569';
        tabsContainer.style.marginBottom = '20px';
        container.appendChild(tabsContainer);

        // Create tab buttons
        const tabButtons = [
            { id: 'color-tab', label: 'Color' },
            { id: 'image-tab', label: 'Image' },
            { id: 'video-tab', label: 'Video' }
        ];

        tabButtons.forEach(tab => {
            const tabButton = document.createElement('button');
            tabButton.id = tab.id;
            tabButton.className = 'tab-button';
            tabButton.textContent = tab.label;
            tabButton.style.padding = '10px 15px';
            tabButton.style.backgroundColor = 'transparent';
            tabButton.style.color = 'white';
            tabButton.style.border = 'none';
            tabButton.style.borderBottom = '3px solid transparent';
            tabButton.style.cursor = 'pointer';
            tabButton.style.fontWeight = '500';
            tabButton.style.transition = 'all 0.3s ease';
            tabButton.style.marginRight = '10px';
            tabsContainer.appendChild(tabButton);

            // Handle tab click event
            tabButton.addEventListener('click', () => {
                // Remove selection from all tabs
                document.querySelectorAll('.tab-button').forEach(btn => {
                    btn.style.borderBottomColor = 'transparent';
                    btn.style.opacity = '0.7';
                });
                
                // Highlight selected tab
                tabButton.style.borderBottomColor = '#3b82f6';
                tabButton.style.opacity = '1';
                
                // Hide all content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.style.display = 'none';
                });
                
                // Show corresponding content
                const contentId = tab.id.replace('-tab', '-content');
                document.getElementById(contentId).style.display = 'block';
            });
        });

        // Tab container content
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content-container';
        container.appendChild(tabContent);

        // Color tab content
        createColorTabContent(tabContent);
        
        // Image tab content
        createImageTabContent(tabContent);
        
        // Video tab content
        createVideoTabContent(tabContent);

        // Add to dashboard
        dashboard.appendChild(customizeSection);
        
        // Default select color tab
        document.getElementById('color-tab').click();
        
        /**
         * Create content for color tab
         * @param {HTMLElement} container - Tab content container
         */
        function createColorTabContent(container) {
            const colorContent = document.createElement('div');
            colorContent.id = 'color-content';
            colorContent.className = 'tab-content';
            colorContent.style.display = 'none';
            container.appendChild(colorContent);
            
            // Create color picker section
            const colorPickerContainer = document.createElement('div');
            colorPickerContainer.style.display = 'grid';
            colorPickerContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
            colorPickerContainer.style.gap = '15px';
            colorContent.appendChild(colorPickerContainer);

            // Preset color list
            const presetColors = [
                { name: 'Dark Blue (Default)', value: '#0f172a' },
                { name: 'Black', value: '#000000' },
                { name: 'Navy Blue', value: '#1e3a8a' },
                { name: 'Dark Red', value: '#7f1d1d' },
                { name: 'Dark Green', value: '#14532d' },
                { name: 'Dark Purple', value: '#4c1d95' }
            ];

            // Create preset color buttons
            presetColors.forEach(color => {
                const colorOption = document.createElement('div');
                colorOption.className = 'color-option';
                colorOption.style.display = 'flex';
                colorOption.style.alignItems = 'center';
                colorOption.style.gap = '10px';
                colorOption.style.cursor = 'pointer';
                colorOption.style.padding = '10px';
                colorOption.style.borderRadius = '8px';
                colorOption.style.transition = 'background-color 0.2s';
                
                colorOption.innerHTML = `
                    <div style="width: 25px; height: 25px; background-color: ${color.value}; border-radius: 4px; border: 1px solid #64748b;"></div>
                    <span>${color.name}</span>
                `;
                
                // Handle color selection event
                colorOption.addEventListener('click', () => {
                    applyBackgroundColor(color.value);
                    updateSelectedColorIndicator(colorOption);
                });
                
                colorPickerContainer.appendChild(colorOption);
            });

            // Create custom color input section
            const customColorContainer = document.createElement('div');
            customColorContainer.style.marginTop = '15px';
            customColorContainer.style.display = 'flex';
            customColorContainer.style.alignItems = 'center';
            customColorContainer.style.gap = '10px';
            colorContent.appendChild(customColorContainer);

            // Add custom color input
            const customColorLabel = document.createElement('label');
            customColorLabel.textContent = 'Custom color:';
            customColorLabel.style.marginRight = '10px';
            customColorContainer.appendChild(customColorLabel);

            const customColorInput = document.createElement('input');
            customColorInput.type = 'color';
            customColorInput.id = 'customColorPicker';
            customColorInput.style.cursor = 'pointer';
            customColorInput.style.width = '40px';
            customColorInput.style.height = '30px';
            customColorContainer.appendChild(customColorInput);

            const applyCustomColorBtn = document.createElement('button');
            applyCustomColorBtn.textContent = 'Apply';
            applyCustomColorBtn.style.background = '#3b82f6';
            applyCustomColorBtn.style.color = 'white';
            applyCustomColorBtn.style.border = 'none';
            applyCustomColorBtn.style.borderRadius = '6px';
            applyCustomColorBtn.style.padding = '8px 12px';
            applyCustomColorBtn.style.cursor = 'pointer';
            applyCustomColorBtn.style.fontWeight = '500';
            customColorContainer.appendChild(applyCustomColorBtn);

            // Handle event when applying custom color
            applyCustomColorBtn.addEventListener('click', () => {
                const customColor = customColorInput.value;
                applyBackgroundColor(customColor);
                // Remove selection from all preset colors
                document.querySelectorAll('.color-option').forEach(option => {
                    option.style.backgroundColor = '';
                });
            });

            // Restore saved color (if any)
            const savedColor = localStorage.getItem('dashboardBackgroundColor');
            if (savedColor) {
                applyBackgroundColor(savedColor);
                
                // Highlight selected color if it's a preset color
                const matchingOption = Array.from(document.querySelectorAll('.color-option')).find(option => {
                    const colorDiv = option.querySelector('div');
                    return colorDiv && colorDiv.style.backgroundColor === savedColor;
                });
                
                if (matchingOption) {
                    updateSelectedColorIndicator(matchingOption);
                }
            } else {
                // Default select first color
                const firstOption = document.querySelector('.color-option');
                if (firstOption) {
                    updateSelectedColorIndicator(firstOption);
                    const firstColorDiv = firstOption.querySelector('div');
                    const firstColor = firstColorDiv ? window.getComputedStyle(firstColorDiv).backgroundColor : '#0f172a';
                    applyBackgroundColor(firstColor);
                }
            }
        }
        
        /**
         * Create content for image tab
         * @param {HTMLElement} container - Tab content container
         */
        function createImageTabContent(container) {
            const imageContent = document.createElement('div');
            imageContent.id = 'image-content';
            imageContent.className = 'tab-content';
            imageContent.style.display = 'none';
            container.appendChild(imageContent);
            
            // Create upload form for images from computer
            const uploadContainer = document.createElement('div');
            uploadContainer.style.marginBottom = '20px';
            uploadContainer.style.padding = '15px';
            uploadContainer.style.backgroundColor = '#334155';
            uploadContainer.style.borderRadius = '8px';
            imageContent.appendChild(uploadContainer);

            const uploadTitle = document.createElement('h4');
            uploadTitle.textContent = 'Upload image from computer';
            uploadTitle.style.margin = '0 0 15px 0';
            uploadTitle.style.color = '#e2e8f0';
            uploadContainer.appendChild(uploadTitle);

            const uploadForm = document.createElement('div');
            uploadForm.style.display = 'flex';
            uploadForm.style.flexDirection = 'column';
            uploadForm.style.gap = '15px';
            uploadContainer.appendChild(uploadForm);

            // Input for uploading image ẩn
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = 'backgroundImageUpload';
            fileInput.style.display = 'none';
            fileInput.accept = 'image/*';
            uploadForm.appendChild(fileInput);

            // Image file selection button
            const chooseFileButton = document.createElement('button');
            chooseFileButton.textContent = 'Select Image';
            chooseFileButton.style.padding = '10px 15px';
            chooseFileButton.style.backgroundColor = '#3b82f6';
            chooseFileButton.style.color = 'white';
            chooseFileButton.style.border = 'none';
            chooseFileButton.style.borderRadius = '6px';
            chooseFileButton.style.cursor = 'pointer';
            chooseFileButton.style.fontWeight = '500';
            chooseFileButton.style.width = '100%';
            uploadForm.appendChild(chooseFileButton);

            // Add preview image
            const previewContainer = document.createElement('div');
            previewContainer.style.marginTop = '10px';
            previewContainer.style.display = 'none';
            previewContainer.style.flexDirection = 'column';
            previewContainer.style.alignItems = 'center';
            previewContainer.style.gap = '10px';
            uploadForm.appendChild(previewContainer);

            const imagePreview = document.createElement('img');
            imagePreview.id = 'imagePreview';
            imagePreview.style.maxWidth = '100%';
            imagePreview.style.maxHeight = '200px';
            imagePreview.style.borderRadius = '8px';
            imagePreview.style.objectFit = 'cover';
            previewContainer.appendChild(imagePreview);

            const applyUploadButton = document.createElement('button');
            applyUploadButton.textContent = 'Use this image';
            applyUploadButton.style.padding = '8px 12px';
            applyUploadButton.style.backgroundColor = '#10b981';
            applyUploadButton.style.color = 'white';
            applyUploadButton.style.border = 'none';
            applyUploadButton.style.borderRadius = '6px';
            applyUploadButton.style.cursor = 'pointer';
            applyUploadButton.style.fontWeight = '500';
            previewContainer.appendChild(applyUploadButton);

            // Create form for entering image URL
            const urlContainer = document.createElement('div');
            urlContainer.style.padding = '15px';
            urlContainer.style.backgroundColor = '#334155';
            urlContainer.style.borderRadius = '8px';
            imageContent.appendChild(urlContainer);

            const urlTitle = document.createElement('h4');
            urlTitle.textContent = 'Enter image URL from internet';
            urlTitle.style.margin = '0 0 15px 0';
            urlTitle.style.color = '#e2e8f0';
            urlContainer.appendChild(urlTitle);

            const urlForm = document.createElement('div');
            urlForm.style.display = 'flex';
            urlForm.style.flexDirection = 'column';
            urlForm.style.gap = '15px';
            urlContainer.appendChild(urlForm);

            const urlInput = document.createElement('input');
            urlInput.type = 'url';
            urlInput.placeholder = 'Enter image URL (e.g.: https://example.com/image.jpg)';
            urlInput.style.padding = '10px';
            urlInput.style.borderRadius = '6px';
            urlInput.style.border = '1px solid #4b5563';
            urlInput.style.backgroundColor = '#1f2937';
            urlInput.style.color = 'white';
            urlForm.appendChild(urlInput);

            const applyUrlButton = document.createElement('button');
            applyUrlButton.textContent = 'Use this URL';
            applyUrlButton.style.padding = '10px 15px';
            applyUrlButton.style.backgroundColor = '#3b82f6';
            applyUrlButton.style.color = 'white';
            applyUrlButton.style.border = 'none';
            applyUrlButton.style.borderRadius = '6px';
            applyUrlButton.style.cursor = 'pointer';
            applyUrlButton.style.fontWeight = '500';
            urlForm.appendChild(applyUrlButton);

            // Background image removal button
            const resetContainer = document.createElement('div');
            resetContainer.style.marginTop = '20px';
            resetContainer.style.textAlign = 'center';
            imageContent.appendChild(resetContainer);

            const resetButton = document.createElement('button');
            resetButton.textContent = 'Remove Background Image';
            resetButton.style.padding = '8px 12px';
            resetButton.style.backgroundColor = '#ef4444';
            resetButton.style.color = 'white';
            resetButton.style.border = 'none';
            resetButton.style.borderRadius = '6px';
            resetButton.style.cursor = 'pointer';
            resetButton.style.fontWeight = '500';
            resetContainer.appendChild(resetButton);

            // Handle event when selecting image
            chooseFileButton.addEventListener('click', () => {
                fileInput.click();
            });

            // Handle event when selecting file
            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    
                    reader.onload = (e) => {
                        const imageDataUrl = e.target.result;
                        imagePreview.src = imageDataUrl;
                        previewContainer.style.display = 'flex';
                    };
                    
                    reader.readAsDataURL(file);
                }
            });

            // Handle event when applying uploaded image
            applyUploadButton.addEventListener('click', () => {
                if (imagePreview.src) {
                    applyBackgroundImage(imagePreview.src);
                }
            });

            // Handle event when applying image URL
            applyUrlButton.addEventListener('click', () => {
                const url = urlInput.value.trim();
                if (url) {
                    applyBackgroundImage(url);
                } else {
                    alert('Please enter a valid image URL');
                }
            });

            // Handle event when removing image
            resetButton.addEventListener('click', () => {
                removeBackgroundImage();
            });

            // Restore image URL from localStorage (if any)
            if (backgroundImageUrl) {
                urlInput.value = backgroundImageUrl;
            }
        }
        
        /**
         * Create content for video tab
         * @param {HTMLElement} container - Tab content container
         */
        function createVideoTabContent(container) {
            const videoContent = document.createElement('div');
            videoContent.id = 'video-content';
            videoContent.className = 'tab-content';
            videoContent.style.display = 'none';
            container.appendChild(videoContent);
            
            // Variable for storing background video URL
            let backgroundVideoUrl = localStorage.getItem('tournamentBackgroundVideo') || '';
            
            // Create YouTube URL input section
            const youtubeContainer = document.createElement('div');
            youtubeContainer.style.marginBottom = '20px';
            youtubeContainer.style.padding = '15px';
            youtubeContainer.style.backgroundColor = '#334155';
            youtubeContainer.style.borderRadius = '8px';
            videoContent.appendChild(youtubeContainer);

            const youtubeTitle = document.createElement('h4');
            youtubeTitle.textContent = 'Enter YouTube video URL';
            youtubeTitle.style.margin = '0 0 15px 0';
            youtubeTitle.style.color = '#e2e8f0';
            youtubeContainer.appendChild(youtubeTitle);

            const youtubeForm = document.createElement('div');
            youtubeForm.style.display = 'flex';
            youtubeForm.style.flexDirection = 'column';
            youtubeForm.style.gap = '15px';
            youtubeContainer.appendChild(youtubeForm);

            const youtubeInput = document.createElement('input');
            youtubeInput.type = 'url';
            youtubeInput.placeholder = 'Enter YouTube URL (e.g.: https://www.youtube.com/watch?v=...)';
            youtubeInput.style.padding = '10px';
            youtubeInput.style.borderRadius = '6px';
            youtubeInput.style.border = '1px solid #4b5563';
            youtubeInput.style.backgroundColor = '#1f2937';
            youtubeInput.style.color = 'white';
            youtubeForm.appendChild(youtubeInput);

            const applyYoutubeButton = document.createElement('button');
            applyYoutubeButton.textContent = 'Use this YouTube video';
            applyYoutubeButton.style.padding = '10px 15px';
            applyYoutubeButton.style.backgroundColor = '#3b82f6';
            applyYoutubeButton.style.color = 'white';
            applyYoutubeButton.style.border = 'none';
            applyYoutubeButton.style.borderRadius = '6px';
            applyYoutubeButton.style.cursor = 'pointer';
            applyYoutubeButton.style.fontWeight = '500';
            youtubeForm.appendChild(applyYoutubeButton);

            // Create form for uploading video from computer
            const uploadContainer = document.createElement('div');
            uploadContainer.style.marginBottom = '20px';
            uploadContainer.style.padding = '15px';
            uploadContainer.style.backgroundColor = '#334155';
            uploadContainer.style.borderRadius = '8px';
            videoContent.appendChild(uploadContainer);

            const uploadTitle = document.createElement('h4');
            uploadTitle.textContent = 'Upload video from computer';
            uploadTitle.style.margin = '0 0 15px 0';
            uploadTitle.style.color = '#e2e8f0';
            uploadContainer.appendChild(uploadTitle);

            const uploadForm = document.createElement('div');
            uploadForm.style.display = 'flex';
            uploadForm.style.flexDirection = 'column';
            uploadForm.style.gap = '15px';
            uploadContainer.appendChild(uploadForm);

            // Input for uploading video ẩn
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = 'backgroundVideoUpload';
            fileInput.style.display = 'none';
            fileInput.accept = 'video/*';
            uploadForm.appendChild(fileInput);

            // Video file selection button
            const chooseFileButton = document.createElement('button');
            chooseFileButton.textContent = 'Select Video';
            chooseFileButton.style.padding = '10px 15px';
            chooseFileButton.style.backgroundColor = '#3b82f6';
            chooseFileButton.style.color = 'white';
            chooseFileButton.style.border = 'none';
            chooseFileButton.style.borderRadius = '6px';
            chooseFileButton.style.cursor = 'pointer';
            chooseFileButton.style.fontWeight = '500';
            chooseFileButton.style.width = '100%';
            uploadForm.appendChild(chooseFileButton);

            // Add preview video
            const previewContainer = document.createElement('div');
            previewContainer.style.marginTop = '10px';
            previewContainer.style.display = 'none';
            previewContainer.style.flexDirection = 'column';
            previewContainer.style.alignItems = 'center';
            previewContainer.style.gap = '10px';
            uploadForm.appendChild(previewContainer);

            const videoPreview = document.createElement('video');
            videoPreview.id = 'videoPreview';
            videoPreview.style.maxWidth = '100%';
            videoPreview.style.maxHeight = '200px';
            videoPreview.style.borderRadius = '8px';
            videoPreview.style.objectFit = 'cover';
            videoPreview.controls = true;
            previewContainer.appendChild(videoPreview);

            const applyUploadButton = document.createElement('button');
            applyUploadButton.textContent = 'Use this video';
            applyUploadButton.style.padding = '8px 12px';
            applyUploadButton.style.backgroundColor = '#10b981';
            applyUploadButton.style.color = 'white';
            applyUploadButton.style.border = 'none';
            applyUploadButton.style.borderRadius = '6px';
            applyUploadButton.style.cursor = 'pointer';
            applyUploadButton.style.fontWeight = '500';
            previewContainer.appendChild(applyUploadButton);

            // Background video removal button
            const resetContainer = document.createElement('div');
            resetContainer.style.marginTop = '20px';
            resetContainer.style.textAlign = 'center';
            videoContent.appendChild(resetContainer);

            const resetButton = document.createElement('button');
            resetButton.textContent = 'Remove Background Video';
            resetButton.style.padding = '8px 12px';
            resetButton.style.backgroundColor = '#ef4444';
            resetButton.style.color = 'white';
            resetButton.style.border = 'none';
            resetButton.style.borderRadius = '6px';
            resetButton.style.cursor = 'pointer';
            resetButton.style.fontWeight = '500';
            resetContainer.appendChild(resetButton);

            // Handle event when selecting file
            chooseFileButton.addEventListener('click', () => {
                fileInput.click();
            });

            // Handle event when selecting file
            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    
                    reader.onload = (e) => {
                        const videoDataUrl = e.target.result;
                        videoPreview.src = videoDataUrl;
                        previewContainer.style.display = 'flex';
                    };
                    
                    reader.readAsDataURL(file);
                }
            });

            // Handle event when applying video
            applyUploadButton.addEventListener('click', () => {
                if (videoPreview.src) {
                    applyBackgroundVideo(videoPreview.src, 'local');
                }
            });

            // Handle event when removing video
            resetButton.addEventListener('click', () => {
                removeBackgroundVideo();
            });

            // Handle event when applying YouTube URL
            applyYoutubeButton.addEventListener('click', () => {
                const url = youtubeInput.value.trim();
                if (url) {
                    applyBackgroundVideo(url, 'youtube');
                } else {
                    alert('Please enter a valid YouTube URL');
                }
            });

            // Restore video URL from localStorage (if any)
            if (backgroundVideoUrl) {
                const videoType = localStorage.getItem('tournamentBackgroundVideoType') || 'youtube';
                if (videoType === 'youtube') {
                    youtubeInput.value = backgroundVideoUrl;
                }
                applyBackgroundVideo(backgroundVideoUrl, videoType);
            }
        }
    }

    /**
     * Update selected color display
     * @param {HTMLElement} selectedOption - Selected color option
     */
    function updateSelectedColorIndicator(selectedOption) {
        // Reset all options
        document.querySelectorAll('.color-option').forEach(option => {
            option.style.backgroundColor = '';
        });
        
        // Highlight selected option
        selectedOption.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
    }

    /**
     * Apply background color and save to localStorage
     * @param {string} color - Color code
     */
    function applyBackgroundColor(color) {
        // Save color to localStorage
        localStorage.setItem('dashboardBackgroundColor', color);
        
        // Apply color to dashboard
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.style.backgroundColor = color;
        }
        
        // Send color notification to live screen if available
        if (window.api) {
            window.api.sendBackgroundColor(color);
        }
        
        console.log(`Applied background color: ${color}`);
    }

    /**
     * Apply background image and save to localStorage
     * @param {string} imageUrl - Image URL
     */
    function applyBackgroundImage(imageUrl) {
        // Save image URL to variable and localStorage
        backgroundImageUrl = imageUrl;
        localStorage.setItem('tournamentBackgroundImage', imageUrl);
        
        // Apply background image to dashboard
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.style.backgroundImage = `url("${imageUrl}")`;
            dashboard.style.backgroundSize = 'cover';
            dashboard.style.backgroundPosition = 'center';
            dashboard.style.backgroundRepeat = 'no-repeat';
        }
        
        // Send background image notification to live screen if available
        if (window.api) {
            window.api.sendBackgroundImage(imageUrl);
        }
        
        console.log(`Applied background image: ${imageUrl}`);
    }

    /**
     * Remove background image
     */
    function removeBackgroundImage() {
        // Remove image URL from variable and localStorage
        backgroundImageUrl = '';
        localStorage.removeItem('tournamentBackgroundImage');
        
        // Remove background image from dashboard
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.style.backgroundImage = 'none';
        }
        
        // Send notification to remove background image to live screen if available
        if (window.api) {
            window.api.sendBackgroundImage('');
        }
        
        console.log('Removed background image');
    }

    /**
     * Add background video picker
     * @param {HTMLElement} dashboard - Dashboard container
     */
    function addBackgroundVideoPicker(dashboard) {
        // Variable for storing background video URL
        let backgroundVideoUrl = localStorage.getItem('tournamentBackgroundVideo') || '';
        
        // Create container for background video options
        const videoSection = document.createElement('div');
        videoSection.className = 'background-video-section';
        videoSection.style.marginTop = '20px';

        // Create container and add to dashboard
        const container = document.createElement('div');
        container.className = 'video-picker-container';
        container.style.background = '#1e293b';
        container.style.borderRadius = '12px';
        container.style.padding = '20px';
        container.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        videoSection.appendChild(container);

        // Create title
        const header = document.createElement('div');
        header.className = 'card-header';
        header.style.marginBottom = '15px';
        header.style.paddingBottom = '15px';
        header.style.borderBottom = '1px solid #475569';
        header.innerHTML = '<h3>Background Video Customization</h3>';
        container.appendChild(header);

        // Create YouTube URL input section
        const youtubeContainer = document.createElement('div');
        youtubeContainer.style.marginBottom = '20px';
        youtubeContainer.style.padding = '15px';
        youtubeContainer.style.backgroundColor = '#334155';
        youtubeContainer.style.borderRadius = '8px';
        container.appendChild(youtubeContainer);

        const youtubeTitle = document.createElement('h4');
        youtubeTitle.textContent = 'Enter YouTube video URL';
        youtubeTitle.style.margin = '0 0 15px 0';
        youtubeTitle.style.color = '#e2e8f0';
        youtubeContainer.appendChild(youtubeTitle);

        const youtubeForm = document.createElement('div');
        youtubeForm.style.display = 'flex';
        youtubeForm.style.flexDirection = 'column';
        youtubeForm.style.gap = '15px';
        youtubeContainer.appendChild(youtubeForm);

        const youtubeInput = document.createElement('input');
        youtubeInput.type = 'url';
        youtubeInput.placeholder = 'Enter YouTube URL (e.g.: https://www.youtube.com/watch?v=...)';
        youtubeInput.style.padding = '10px';
        youtubeInput.style.borderRadius = '6px';
        youtubeInput.style.border = '1px solid #4b5563';
        youtubeInput.style.backgroundColor = '#1f2937';
        youtubeInput.style.color = 'white';
        youtubeForm.appendChild(youtubeInput);

        const applyYoutubeButton = document.createElement('button');
        applyYoutubeButton.textContent = 'Use this YouTube video';
        applyYoutubeButton.style.padding = '10px 15px';
        applyYoutubeButton.style.backgroundColor = '#3b82f6';
        applyYoutubeButton.style.color = 'white';
        applyYoutubeButton.style.border = 'none';
        applyYoutubeButton.style.borderRadius = '6px';
        applyYoutubeButton.style.cursor = 'pointer';
        applyYoutubeButton.style.fontWeight = '500';
        youtubeForm.appendChild(applyYoutubeButton);

        // Create form for uploading video from computer
        const uploadContainer = document.createElement('div');
        uploadContainer.style.marginBottom = '20px';
        uploadContainer.style.padding = '15px';
        uploadContainer.style.backgroundColor = '#334155';
        uploadContainer.style.borderRadius = '8px';
        container.appendChild(uploadContainer);

        const uploadTitle = document.createElement('h4');
        uploadTitle.textContent = 'Upload video from computer';
        uploadTitle.style.margin = '0 0 15px 0';
        uploadTitle.style.color = '#e2e8f0';
        uploadContainer.appendChild(uploadTitle);

        const uploadForm = document.createElement('div');
        uploadForm.style.display = 'flex';
        uploadForm.style.flexDirection = 'column';
        uploadForm.style.gap = '15px';
        uploadContainer.appendChild(uploadForm);

        // Input for uploading video ẩn
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'backgroundVideoUpload';
        fileInput.style.display = 'none';
        fileInput.accept = 'video/*';
        uploadForm.appendChild(fileInput);

        // Video file selection button
        const chooseFileButton = document.createElement('button');
        chooseFileButton.textContent = 'Select Video';
        chooseFileButton.style.padding = '10px 15px';
        chooseFileButton.style.backgroundColor = '#3b82f6';
        chooseFileButton.style.color = 'white';
        chooseFileButton.style.border = 'none';
        chooseFileButton.style.borderRadius = '6px';
        chooseFileButton.style.cursor = 'pointer';
        chooseFileButton.style.fontWeight = '500';
        chooseFileButton.style.width = '100%';
        uploadForm.appendChild(chooseFileButton);

        // Add preview video
        const previewContainer = document.createElement('div');
        previewContainer.style.marginTop = '10px';
        previewContainer.style.display = 'none';
        previewContainer.style.flexDirection = 'column';
        previewContainer.style.alignItems = 'center';
        previewContainer.style.gap = '10px';
        uploadForm.appendChild(previewContainer);

        const videoPreview = document.createElement('video');
        videoPreview.id = 'videoPreview';
        videoPreview.style.maxWidth = '100%';
        videoPreview.style.maxHeight = '200px';
        videoPreview.style.borderRadius = '8px';
        videoPreview.style.objectFit = 'cover';
        videoPreview.controls = true;
        previewContainer.appendChild(videoPreview);

        const applyUploadButton = document.createElement('button');
        applyUploadButton.textContent = 'Use this video';
        applyUploadButton.style.padding = '8px 12px';
        applyUploadButton.style.backgroundColor = '#10b981';
        applyUploadButton.style.color = 'white';
        applyUploadButton.style.border = 'none';
        applyUploadButton.style.borderRadius = '6px';
        applyUploadButton.style.cursor = 'pointer';
        applyUploadButton.style.fontWeight = '500';
        previewContainer.appendChild(applyUploadButton);

        // Background video removal button
        const resetContainer = document.createElement('div');
        resetContainer.style.marginTop = '20px';
        resetContainer.style.textAlign = 'center';
        container.appendChild(resetContainer);

        const resetButton = document.createElement('button');
        resetButton.textContent = 'Remove Background Video';
        resetButton.style.padding = '8px 12px';
        resetButton.style.backgroundColor = '#ef4444';
        resetButton.style.color = 'white';
        resetButton.style.border = 'none';
        resetButton.style.borderRadius = '6px';
        resetButton.style.cursor = 'pointer';
        resetButton.style.fontWeight = '500';
        resetContainer.appendChild(resetButton);

        // Handle event when selecting file
        chooseFileButton.addEventListener('click', () => {
            fileInput.click();
        });

        // Handle event when selecting file
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    const videoDataUrl = e.target.result;
                    videoPreview.src = videoDataUrl;
                    previewContainer.style.display = 'flex';
                };
                
                reader.readAsDataURL(file);
            }
        });

        // Handle event when applying video
        applyUploadButton.addEventListener('click', () => {
            if (videoPreview.src) {
                applyBackgroundVideo(videoPreview.src, 'local');
            }
        });

        // Handle event when removing video
        resetButton.addEventListener('click', () => {
            removeBackgroundVideo();
        });

        // Handle event when applying YouTube URL
        applyYoutubeButton.addEventListener('click', () => {
            const url = youtubeInput.value.trim();
            if (url) {
                applyBackgroundVideo(url, 'youtube');
            } else {
                alert('Please enter a valid YouTube URL');
            }
        });

        // Restore video URL from localStorage (if any)
        if (backgroundVideoUrl) {
            const videoType = localStorage.getItem('tournamentBackgroundVideoType') || 'youtube';
            if (videoType === 'youtube') {
                youtubeInput.value = backgroundVideoUrl;
            }
            applyBackgroundVideo(backgroundVideoUrl, videoType);
        }
    }
    
    /**
     * Apply background video and save to localStorage
     * @param {string} videoUrl - Video URL
     * @param {string} videoType - Video type ('youtube' or 'local')
     */
    function applyBackgroundVideo(videoUrl, videoType) {
        // Save video URL and type to localStorage
        localStorage.setItem('tournamentBackgroundVideo', videoUrl);
        localStorage.setItem('tournamentBackgroundVideoType', videoType);
        
        // Remove background image (if any)
        removeBackgroundImage();
        
        // Remove old background video (if any)
        const existingVideo = document.getElementById('backgroundVideo');
        if (existingVideo) {
            existingVideo.remove();
        }
        
        // Create and apply background video to dashboard
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            let videoElement;
            
            if (videoType === 'youtube') {
                // Process YouTube URL to get video ID
                const videoId = getYoutubeVideoId(videoUrl);
                if (!videoId) {
                    alert('Invalid YouTube URL');
                    return;
                }
                
                // Create iframe for YouTube video
                videoElement = document.createElement('iframe');
                videoElement.id = 'backgroundVideo';
                videoElement.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0`;
                videoElement.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                videoElement.allowFullscreen = true;
            } else {
                // Create video element for local video
                videoElement = document.createElement('video');
                videoElement.id = 'backgroundVideo';
                videoElement.src = videoUrl;
                videoElement.autoplay = true;
                videoElement.loop = true;
                videoElement.muted = true;
                videoElement.playsinline = true;
            }
            
            // Set style for video element
            videoElement.style.position = 'absolute';
            videoElement.style.top = '0';
            videoElement.style.left = '0';
            videoElement.style.width = '100%';
            videoElement.style.height = '100%';
            videoElement.style.objectFit = 'cover';
            videoElement.style.zIndex = '0';
            
            // Add video to dashboard
            dashboard.style.position = 'relative';
            dashboard.style.overflow = 'hidden';
            dashboard.insertBefore(videoElement, dashboard.firstChild);
            
            // Ensure other elements are above the video
            const dashboardElements = dashboard.querySelectorAll(':not(#backgroundVideo)');
            dashboardElements.forEach(element => {
                element.style.position = 'relative';
                element.style.zIndex = '1';
            });
        }
        
        // Send background video notification to live screen if available
        if (window.api) {
            window.api.sendBackgroundVideo({url: videoUrl, type: videoType});
        }
        
        console.log(`Applied background video: ${videoUrl} (${videoType})`);
    }
    
    /**
     * Remove background video
     */
    function removeBackgroundVideo() {
        // Remove video from localStorage
        localStorage.removeItem('tournamentBackgroundVideo');
        localStorage.removeItem('tournamentBackgroundVideoType');
        
        // Remove video element from dashboard
        const videoElement = document.getElementById('backgroundVideo');
        if (videoElement) {
            videoElement.remove();
        }
        
        // Send notification to remove background video to live screen if available
        if (window.api) {
            window.api.sendBackgroundVideo({url: '', type: ''});
        }
        
        console.log('Removed background video');
    }
    
    /**
     * Get video ID from YouTube URL
     * @param {string} url - YouTube URL
     * @returns {string|null} - Video ID or null if invalid
     */
    function getYoutubeVideoId(url) {
        // Patterns for common YouTube URL formats
        const patterns = [
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:.*&)?v=([^&#]+)/i,
            /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?&#]+)/i,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?&#]+)/i
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }
        
        return null;
    }
});
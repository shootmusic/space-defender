class SpaceDefender {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Player dengan design lebih keren
        this.player = {
            x: this.canvas.width / 2 - 25,
            y: this.canvas.height - 80,
            width: 60,
            height: 60,
            speed: 8,
            color: '#00ff00'
        };
        
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.clickEffects = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.gameRunning = true;
        this.gamePaused = false;
        
        this.keys = {};
        this.enemySpawnRate = 80;
        this.frameCount = 0;
        this.shootCooldown = 0;
        
        // Mobile controls
        this.touchStartX = 0;
        this.isDragging = false;
        this.autoShootInterval = null;
        this.isMobile = this.detectMobile();
        
        // Sound elements
        this.shootSound = document.getElementById('shootSound');
        this.explosionSound = document.getElementById('explosionSound');
        this.gameOverSound = document.getElementById('gameOverSound');
        
        this.setupEventListeners();
        this.setupMobileControls();
        this.updateUI();
        this.gameLoop();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if ((e.key === ' ' || e.key === 'Spacebar') && !this.gameOver && this.gameRunning && this.shootCooldown <= 0) {
                this.shoot();
                this.shootCooldown = 10;
            }
            
            if ((e.key === 'r' || e.key === 'R') && this.gameOver) {
                this.restartGame();
            }
            
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Mouse controls
        this.canvas.addEventListener('click', (e) => {
            if (!this.gameOver && this.gameRunning && this.shootCooldown <= 0 && !this.isMobile) {
                this.shoot();
                this.createClickEffect(e.offsetX, e.offsetY);
                this.shootCooldown = 10;
            }
        });
    }
    
    setupMobileControls() {
        if (!this.isMobile) return;
        
        const touchArea = document.getElementById('touchArea');
        const shootBtn = document.getElementById('shootBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const mobileControls = document.getElementById('mobileControls');
        
        // Show mobile controls
        mobileControls.style.display = 'block';
        
        // Touch drag movement dengan auto-shoot
        touchArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameOver || this.gamePaused) return;
            
            this.touchStartX = e.touches[0].clientX;
            this.isDragging = true;
            this.startAutoShoot();
        });
        
        touchArea.addEventListener('touchmove', (e) => {
            if (!this.isDragging || this.gameOver || this.gamePaused) return;
            e.preventDefault();
            
            const touchX = e.touches[0].clientX;
            const deltaX = touchX - this.touchStartX;
            
            if (deltaX > 15) {
                // Move right
                this.player.x = Math.min(this.canvas.width - this.player.width, this.player.x + 10);
                this.touchStartX = touchX;
            } else if (deltaX < -15) {
                // Move left
                this.player.x = Math.max(0, this.player.x - 10);
                this.touchStartX = touchX;
            }
        });
        
        touchArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isDragging = false;
            this.stopAutoShoot();
        });
        
        // Manual shoot button
        shootBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.gameOver && this.gameRunning && this.shootCooldown <= 0) {
                this.shoot();
                this.shootCooldown = 15;
            }
        });
        
        // Pause button
        pauseBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.togglePause();
        });
    }
    
    startAutoShoot() {
        if (this.autoShootInterval) return;
        
        this.autoShootInterval = setInterval(() => {
            if (!this.gameOver && this.gameRunning && !this.gamePaused && this.shootCooldown <= 0) {
                this.shoot();
                this.shootCooldown = 8; // Faster shooting on auto
            }
        }, 300);
    }
    
    stopAutoShoot() {
        if (this.autoShootInterval) {
            clearInterval(this.autoShootInterval);
            this.autoShootInterval = null;
        }
    }
    
    togglePause() {
        this.gamePaused = !this.gamePaused;
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.textContent = this.gamePaused ? '▶️ PLAY' : '⏸️ PAUSE';
        }
        
        if (!this.gamePaused && !this.gameOver) {
            this.gameLoop();
        }
    }
    
    createClickEffect(x, y) {
        this.clickEffects.push({
            x: x,
            y: y,
            size: 20,
            life: 30
        });
    }
    
    playSound(sound) {
        try {
            sound.currentTime = 0;
            sound.play().catch(e => console.log("Sound play prevented:", e));
        } catch (error) {
            console.log("Sound error:", error);
        }
    }
    
    shoot() {
        // Play shoot sound
        this.playSound(this.shootSound);
        
        // Efek visual
        this.createParticles(this.player.x + this.player.width/2, this.player.y, 5, '#ffff00');
        
        this.bullets.push({
            x: this.player.x + this.player.width / 2 - 3,
            y: this.player.y,
            width: 6,
            height: 20,
            speed: 12,
            color: '#ffff00'
        });
    }
    
    spawnEnemy() {
        const enemyTypes = [
            { width: 35, height: 35, color: '#ff0000', speed: 2.5, score: 10 },
            { width: 25, height: 25, color: '#ff4444', speed: 3.5, score: 15 },
            { width: 45, height: 45, color: '#ff0000', speed: 1.5, score: 20 }
        ];
        
        const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        this.enemies.push({
            x: Math.random() * (this.canvas.width - type.width),
            y: -type.height,
            width: type.width,
            height: type.height,
            speed: type.speed + this.level * 0.3,
            color: type.color,
            scoreValue: type.score
        });
    }
    
    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 4,
                speedY: (Math.random() - 0.5) * 4,
                color: color,
                life: 30
            });
        }
    }
    
    update() {
        if (this.gameOver || !this.gameRunning || this.gamePaused) return;
        
        // Cooldown shooting
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
        
        // Player movement - A & D keys (for desktop)
        if (!this.isMobile) {
            if ((this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft']) && this.player.x > 0) {
                this.player.x -= this.player.speed;
            }
            if ((this.keys['d'] || this.keys['D'] || this.keys['ArrowRight']) && this.player.x < this.canvas.width - this.player.width) {
                this.player.x += this.player.speed;
            }
        }
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bullet.speed;
            return bullet.y > -bullet.height;
        });
        
        // Spawn enemies berdasarkan level
        this.frameCount++;
        const spawnRate = Math.max(30, this.enemySpawnRate - this.level * 3);
        if (this.frameCount % spawnRate === 0) {
            this.spawnEnemy();
        }
        
        // Update enemies and check collisions
        this.enemies = this.enemies.filter(enemy => {
            enemy.y += enemy.speed;
            
            // Check bullet collisions
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                const bullet = this.bullets[i];
                if (this.checkCollision(bullet, enemy)) {
                    this.bullets.splice(i, 1);
                    this.score += enemy.scoreValue;
                    this.createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 8, enemy.color);
                    this.playSound(this.explosionSound);
                    this.updateUI();
                    return false;
                }
            }
            
            // Check player collision
            if (this.checkCollision(this.player, enemy)) {
                this.lives--;
                this.createParticles(this.player.x + this.player.width/2, this.player.y + this.player.height/2, 15, '#ff0000');
                this.playSound(this.explosionSound);
                this.updateUI();
                if (this.lives <= 0) {
                    this.endGame();
                }
                return false;
            }
            
            return enemy.y < this.canvas.height;
        });
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.life--;
            return particle.life > 0;
        });
        
        // Update click effects
        this.clickEffects = this.clickEffects.filter(effect => {
            effect.life--;
            return effect.life > 0;
        });
        
        // Level up
        if (this.score >= this.level * 100) {
            this.level++;
            this.updateUI();
            this.createParticles(this.canvas.width/2, 50, 20, '#00ffff');
        }
    }
    
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    drawPlayer() {
        // Pesawat lebih detail
        this.ctx.fillStyle = this.player.color;
        
        // Body pesawat
        this.ctx.fillRect(this.player.x + 10, this.player.y, 40, 40);
        
        // Sayap
        this.ctx.fillStyle = '#00cc00';
        this.ctx.fillRect(this.player.x, this.player.y + 10, 60, 20);
        
        // Cockpit
        this.ctx.fillStyle = '#00ffff';
        this.ctx.fillRect(this.player.x + 25, this.player.y + 10, 10, 10);
        
        // Mesin
        this.ctx.fillStyle = '#ffff00';
        this.ctx.fillRect(this.player.x + 15, this.player.y + 45, 10, 10);
        this.ctx.fillRect(this.player.x + 35, this.player.y + 45, 10, 10);
    }
    
    drawEnemy(enemy) {
        this.ctx.fillStyle = enemy.color;
        this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Detail musuh
        this.ctx.fillStyle = '#ff6666';
        this.ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, enemy.height - 10);
    }
    
    drawClickEffects() {
        this.clickEffects.forEach(effect => {
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = effect.life / 30;
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, effect.size * (1 - effect.life/30), 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        });
    }
    
    drawMobileControls() {
        if (!this.isMobile) return;
        
        // Draw touch area visual feedback
        if (this.isDragging) {
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
            this.ctx.fillRect(this.canvas.width * 0.15, this.canvas.height - 200, this.canvas.width * 0.7, 150);
        }
    }
    
    draw() {
        // Clear canvas dengan gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#001122');
        gradient.addColorStop(1, '#000011');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars (background)
        this.drawStars();
        
        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / 30;
            this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        });
        this.ctx.globalAlpha = 1;
        
        // Draw click effects
        this.drawClickEffects();
        
        // Draw player
        this.drawPlayer();
        
        // Draw bullets
        this.ctx.fillStyle = '#ffff00';
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            // Efek laser
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            this.ctx.fillRect(bullet.x - 1, bullet.y + bullet.height, 3, 10);
            this.ctx.fillStyle = '#ffff00';
        });
        
        // Draw enemies
        this.enemies.forEach(enemy => {
            this.drawEnemy(enemy);
        });
        
        // Draw mobile controls feedback
        this.drawMobileControls();
        
        // Draw level info
        if (this.frameCount % 120 < 60 && !this.gameOver) {
            this.ctx.fillStyle = '#00ffff';
            this.ctx.font = '20px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`LEVEL ${this.level}`, this.canvas.width / 2, 30);
        }
        
        // Draw control hint
        if (this.frameCount < 180 && !this.gameOver && !this.isMobile) {
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '16px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Use A/D to move • Click to shoot', this.canvas.width / 2, this.canvas.height - 20);
        }
        
        // Draw pause indicator
        if (this.gamePaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = '30px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME PAUSED', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '18px Courier New';
            this.ctx.fillText('Tap PLAY button to continue', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
    }
    
    drawStars() {
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 100; i++) {
            const x = (i * 97) % this.canvas.width;
            const y = (i * 53) % this.canvas.height;
            const size = Math.random() * 2 + 0.5;
            this.ctx.fillRect(x, y, size, size);
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        
        if (!this.gameOver && this.gameRunning && !this.gamePaused) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
    }
    
    endGame() {
        this.gameOver = true;
        this.gameRunning = false;
        this.stopAutoShoot();
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.remove('hidden');
        this.playSound(this.gameOverSound);
    }
    
    restartGame() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.clickEffects = [];
        this.gameOver = false;
        this.gameRunning = true;
        this.gamePaused = false;
        this.frameCount = 0;
        this.shootCooldown = 0;
        this.stopAutoShoot();
        this.updateUI();
        document.getElementById('gameOver').classList.add('hidden');
        
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.textContent = '⏸️ PAUSE';
        }
        
        this.gameLoop();
    }
}

// Initialize game when page loads
let game;

window.addEventListener('load', () => {
    game = new SpaceDefender();
});

// Global function for restart button
function restartGame() {
    if (game) {
        game.restartGame();
    } else {
        game = new SpaceDefender();
    }
}
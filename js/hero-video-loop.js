const video = document.getElementById("hero-video");

if (video) {
    const fadeDurationMs = 500;
    const restartDelayMs = 100;
    let frameId = null;
    let fadeToken = 0;
    let isFadingOut = false;

    const stopAnimationFrame = () => {
        if (frameId !== null) {
            cancelAnimationFrame(frameId);
            frameId = null;
        }
    };

    const fadeTo = (targetOpacity, durationMs, onDone) => {
        stopAnimationFrame();
        fadeToken += 1;
        const token = fadeToken;
        const start = performance.now();
        const startOpacity = Number.parseFloat(video.style.opacity || "0");
        const delta = targetOpacity - startOpacity;

        const animate = (now) => {
            if (token !== fadeToken) {
                return;
            }

            const progress = Math.min((now - start) / durationMs, 1);
            video.style.opacity = String(startOpacity + delta * progress);

            if (progress < 1) {
                frameId = requestAnimationFrame(animate);
                return;
            }

            frameId = null;
            if (typeof onDone === "function") {
                onDone();
            }
        };

        frameId = requestAnimationFrame(animate);
    };

    const replay = () => {
        stopAnimationFrame();
        isFadingOut = false;
        video.style.opacity = "0";
        video.currentTime = 0;

        const playPromise = video.play();
        if (playPromise && typeof playPromise.then === "function") {
            playPromise.then(() => {
                fadeTo(1, fadeDurationMs);
            }).catch(() => {
                // Ignore autoplay blocks; the next user interaction or cycle can retry.
            });
        } else {
            fadeTo(1, fadeDurationMs);
        }
    };

    const monitorForFadeOut = () => {
        if (!Number.isFinite(video.duration) || video.duration <= 0 || video.paused) {
            frameId = requestAnimationFrame(monitorForFadeOut);
            return;
        }

        const remaining = video.duration - video.currentTime;
        if (!isFadingOut && remaining <= fadeDurationMs / 1000) {
            isFadingOut = true;
            fadeTo(0, fadeDurationMs);
        }

        frameId = requestAnimationFrame(monitorForFadeOut);
    };

    video.addEventListener("play", () => {
        stopAnimationFrame();
        frameId = requestAnimationFrame(monitorForFadeOut);
    });

    video.addEventListener("ended", () => {
        stopAnimationFrame();
        video.style.opacity = "0";
        window.setTimeout(() => {
            replay();
        }, restartDelayMs);
    });

    video.addEventListener("loadeddata", () => {
        replay();
    }, { once: true });
}

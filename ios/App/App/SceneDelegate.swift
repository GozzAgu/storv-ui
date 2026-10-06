import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard scene is UIWindowScene else { return }

        // Plugins that read UIApplication.shared.delegate?.window still expect a window there.
        (UIApplication.shared.delegate as? AppDelegate)?.window = window

        if let urlContext = connectionOptions.urlContexts.first {
            forward(urlContext)
        }
        if let userActivity = connectionOptions.userActivities.first {
            forward(userActivity)
        }
    }

    // MARK: Privacy cover
    // Blurs sales, costs and customer details before iOS snapshots the app for the switcher.
    // Done natively because the web view can't repaint before the snapshot is taken.

    private var privacyCover: UIView?

    func sceneWillResignActive(_ scene: UIScene) {
        guard privacyCover == nil, let window else { return }
        let cover = UIVisualEffectView(effect: UIBlurEffect(style: .systemThickMaterial))
        cover.frame = window.bounds
        cover.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        window.addSubview(cover)
        privacyCover = cover
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        guard let cover = privacyCover else { return }
        privacyCover = nil
        UIView.animate(withDuration: 0.2, animations: { cover.alpha = 0 }) { _ in
            cover.removeFromSuperview()
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        if let urlContext = URLContexts.first {
            forward(urlContext)
        }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        forward(userActivity)
    }

    private func forward(_ urlContext: UIOpenURLContext) {
        var options: [UIApplication.OpenURLOptionsKey: Any] = [:]
        if let sourceApplication = urlContext.options.sourceApplication {
            options[.sourceApplication] = sourceApplication
        }
        if let annotation = urlContext.options.annotation {
            options[.annotation] = annotation
        }
        options[.openInPlace] = urlContext.options.openInPlace
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: urlContext.url, options: options)
    }

    private func forward(_ userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity) { _ in }
    }
}

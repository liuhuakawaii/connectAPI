import { checkPrivilege } from "./net";

const ALL_PERMISSION = [
    /* header */
    'wallet.header.view',
    'subscription.header.view',
    'links.header.view',
    'user.header.view',
    'logo.header.view',
    'header.translate.view',

    /* module */
    'rodin.view',
    'omnicraft.view',
    'chatavatar.view',

    /* footer */
    'footer.rodin.view',

    /* mobile */
    'mobile.feature',

    /* index */
    'nav.index.view',

    /* index rodin */
    'wallet.index.rodin.view',
    'private.index.rodin.view',

    /* gallery rodin */
    'featured.nav.gallery.rodin.view',
    'mine.nav.gallery.rodin.view',
    'story.nav.gallery.rodin.view',
    'recent.nav.gallery.rodin.view',
    'search.rodin.view',

    /* card */
    'share.card.rodin.view',
    'private.card.rodin.view',
    'like.card.rodin.view',
    'sketchfab.card.rodin.view',

    /* billing */
    'billing.view',
    'billing.feature',

    /* auth */
    'verification.register.feature',
    'oauth.login.feature',
    'forget_password.register.feature',

    /* api */
    'api.view',
    'api.feature',

    /* other */
    'feedback.view',
    'workbench.view',
    'referral.feature',
    'rodin.onboard.view',
    'terms.view',
    'consent.view',
    'captcha.feature',
    'control_net.feature'
];

const roles = {
    user: {
        allow: ALL_PERMISSION,
        deny: [
            'rodin.onboard.view',
            'captcha.feature',
            'workbench.view',
            'omnicraft.view'
        ]
    },
    dev: {
        allow: [...ALL_PERMISSION],
        deny: [
            'rodin.onboard.view',
            'terms.view',
            'consent.view',
            'captcha.feature',
        ]
    },
    bambu: {
        allow: ALL_PERMISSION,
        deny: [
            /* index */
            'nav.index.view',

            /* Header */
            'wallet.header.view',
            'subscription.header.view',
            'links.header.view',
            // 'user.header.view',
            'logo.header.view',

            /* index rodin */
            'wallet.index.rodin.view',
            'private.index.rodin.view',

            /* gallery rodin */
            // 'featured.nav.gallery.rodin.view',
            // 'mine.nav.gallery.rodin.view',
            'story.nav.gallery.rodin.view',
            'recent.nav.gallery.rodin.view',

            /* card */
            'share.card.rodin.view',
            'private.card.rodin.view',
            'like.card.rodin.view',
            'sketchfab.card.rodin.view',

            /* billing */
            'billing.view',
            'billing.feature',

            /* auth */
            'verification.register.feature',
            'oauth.login.feature',
            'forget_password.register.feature',

            /* api */
            'api.view',
            'api.feature',

            /* other */
            'feedback.view',
            'referral.feature',
            'rodin.onboard.view',
            'terms.view',
            'consent.view',
        ]
    },
    bytedance: {
        allow: ALL_PERMISSION,
        deny: [
            /* index */
            'nav.index.view',

            /* header */
            'wallet.header.view',
            'subscription.header.view',
            'links.header.view',
            // 'user.header.view',
            'logo.header.view',

            /* footer */
            'footer.rodin.view',

            /* mobile */
            'mobile.feature',

            /* index rodin */
            'wallet.index.rodin.view',
            'private.index.rodin.view',
            'search.rodin.view',

            /* gallery rodin */
            'featured.nav.gallery.rodin.view',
            'mine.nav.gallery.rodin.view',
            'story.nav.gallery.rodin.view',
            'recent.nav.gallery.rodin.view',

            /* card */
            'share.card.rodin.view',
            'private.card.rodin.view',
            'like.card.rodin.view',
            'sketchfab.card.rodin.view',

            /* billing */
            'billing.view',
            'billing.feature',

            /* api */
            'api.view',
            'api.feature',

            /* auth */
            'verification.register.feature',
            'oauth.login.feature',
            'forget_password.register.feature',

            /* other */
            'feedback.view',
            'referral.feature',
            'rodin.onboard.view',
            'terms.view',
            'consent.view',
        ]
    },
    netease: {
        allow: ALL_PERMISSION,
        deny: [
            /* Header */
            'wallet.header.view',
            'subscription.header.view',
            'links.header.view',
            'user.header.view',
            'logo.header.view',
            'header.translate.view',

            /* footer */
            'footer.rodin.view',

            /* mobile */
            'mobile.feature',

            /* index */
            'nav.index.view',

            /* index rodin */
            'wallet.index.rodin.view',
            'private.index.rodin.view',
            'search.rodin.view',

            /* gallery rodin */
            'featured.nav.gallery.rodin.view',
            'mine.nav.gallery.rodin.view',
            'story.nav.gallery.rodin.view',
            'recent.nav.gallery.rodin.view',

            /* card */
            'share.card.rodin.view',
            'private.card.rodin.view',
            'like.card.rodin.view',
            'sketchfab.card.rodin.view',

            /* billing */
            'billing.view',
            'billing.feature',

            /* api */
            'api.view',
            'api.feature',

            /* auth */
            'verification.register.feature',
            'oauth.login.feature',
            'forget_password.register.feature',

            /* other */
            'feedback.view',
            // 'workbench.view',
            'referral.feature',
            'rodin.onboard.view',
            'terms.view',
            'consent.view',
        ]
    }
};

export async function getPermission(role) {

    if (roles[role]) {
        let permissions;
        if (roles[role].allow) {
            permissions = roles[role].allow;
        } else {
            permissions = ALL_PERMISSION;
        }
        if (roles[role].deny) {
            permissions = permissions.filter(perm => !roles[role].deny.includes(perm));
        }
        return permissions;
    } else {
        throw new Error("Role not found");
    }
}
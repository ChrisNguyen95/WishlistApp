const express = require('express');
const request = require('request-promise-native');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

const apiKey = '20f2c3331d44bb4f0a55880f31d5bba1';
const token = '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';
const shopUrl = 'artdeco-official.myshopify.com';
const customerId = '6245463818340';

const apiUrl = `https://${apiKey}:${token}@${shopUrl}/admin/api/2023-10/customers/${customerId}/metafields.json`;

app.use(express.json());
app.use(cors());
    
app.get('/home', function(req, res){
    res.sendFile('index.html', {root: __dirname })
})

let get = {
    'method': 'GET',
    'url': apiUrl,
    'headers': {
        'Content-Type': 'application/json'
    }
}

app.get('/get', async (req, res)=> {
    try {
    await request(get, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            const data = JSON.parse(response.body);
            let wishlistValue = null;

            for (const metafield of data.metafields) {
            if (metafield.key === "wishlist") {
                wishlistValue = metafield.value;
                break;
                }
            }
            if (wishlistValue) {
                try {
                    const wishlistData = JSON.parse(wishlistValue);
                    res.send(wishlistData);
                } catch (error) {
                    console.error("Error parsing 'wishlist' value:", error);
                }
            } else {
                console.log("Wishlist empty");
            }
        }
    })
}catch (error) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
}
})

app.post('/add-to-wishlist', async (req, res) => {
    const newItem = {                
        "product_id": req.body.productId,
        "product_handle": req.body.productHandle
    };

    try {
        const getWishlistRequest = {
            method: 'GET',
            uri: apiUrl,
            json: true,
        };

        const currentMetafield = await request(getWishlistRequest);

        let wishlistItems = [];
        let metafieldId = '';
        if (currentMetafield) {
            for (const metafield of currentMetafield.metafields) {
                if (metafield.key === "wishlist") {
                    wishlistItems = JSON.parse(metafield.value).wishlist_items;
                    metafieldId = metafield.id;
                    break;
                }
            }
        }

        const existingItemIndex = wishlistItems.findIndex(item => (
            item.product_id === newItem.product_id 
        ));

        if (existingItemIndex !== -1) {
            wishlistItems.splice(existingItemIndex, 1);
        } else {
            wishlistItems.push(newItem);
        }

        const updateWishlistRequest = {
            method: 'POST', 
            uri: apiUrl,
            json: true,
            body: {
                "metafield": {
                    "id": metafieldId,
                    "namespace": "custom",
                    "key": "wishlist",
                    "value": JSON.stringify({ wishlist_items: wishlistItems }),
                },
            },
        };

        const response = await request(updateWishlistRequest);

        res.json({ success: true, message: 'Item added to wishlist', response });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

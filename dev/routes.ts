import { body, createJsonRouter, params, validArgument } from "../src/index.js";

const api = createJsonRouter();

// Exemple de route avec validation body
api.post('/users', () => {
    const name = body('name').string.required.value;
    const age = body('age').number.max(150).value;

    return { name, age };
});

// Exemple de route avec validation params
api.get('/users/:id', () => {
    const id = params('id').number.required.value;
    return { id };
});

// Exemple de route qui retourne 204
api.delete('/users/:id', () => {
    const id = params('id').number.required.value;
    console.log(`Deleting user ${id}`);
    // return undefined -> 204 No Content
});


api.post('/array', () => {
    const items = body('items').array.ofNumbers({ max: 20, positive: true }).minLength(1).value;
    return { items };
});


// Object validation
type UserData = {
    id: number;
    name: string;
}

function userValidator(obj: Record<string, unknown>): UserData {
    const id = validArgument(obj, 'id').number.required.positive.value;
    const name = validArgument(obj, 'name').string.required.minLength(3).value;
    return { id, name };
}

api.post('/object', () => {
    const data = body('data').object(userValidator).required.value;
    return { data };
});


// Array of objects validation
api.post('/users/batch', () => {
    const users = body('users').array.ofObjects((obj) => {
        const id = validArgument(obj, 'id').number.required.positive.value;
        const name = validArgument(obj, 'name').string.required.minLength(2).value;
        const email = validArgument(obj, 'email').string.email.value;
        return { id, name, email };
    }).required.minLength(1).value;

    return { users, count: users.length };
});

export default api.router;

/**
 * It will Box the value inside of an object so can be passed around as a reference type
 */
type Box<T> = { value: Awaited<T> | undefined };

export default Box;

export interface LinksRepository
{
	addLink(username: string, link: string);
	
	/**
	 * 
	 * @param link- the link to search
	 * @return true if link was found (and removed). false otherwise.
	 */
	removeLink(username: string): boolean;

	//this is for the automated-tests only:
	getLink(username: string): string;
}

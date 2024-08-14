import { AuthenticationAccountRepository,
	AuthenticationUser,
    AuthenticationUserImpl } from 'authentication-flows-js';
const debug = require('debug')('authentication-account-inmem-repository');

export class AuthenticationAccountInmemRepository implements AuthenticationAccountRepository {

    private users = new Map<string, AuthenticationUser>();

    loadUserByUsername(username: string): Promise<AuthenticationUser> {
        return Promise.resolve( this.users.get(username) );
    }

    setEnabled(username: string) {
        this.setEnabledFlag(username, true);
    }

    setDisabled(username: string) {
        this.setEnabledFlag(username, false);
    }

    protected async setEnabledFlag(username: string, flag: boolean) {

        const storedUser: AuthenticationUser =  await this.loadUserByUsername(username);
        const newUser: AuthenticationUser = new AuthenticationUserImpl(
            username,
            storedUser.getPassword(),
            flag,
            storedUser.getLoginAttemptsLeft(),
            storedUser.getPasswordLastChangeDate(),
            storedUser.getFirstName(),
            storedUser.getLastName(),
            storedUser.getAuthorities(),
            storedUser.getToken(),
            storedUser.getTokenDate()
        );

        //delete old user and set a new one, since iface does not support "setPassword()":
        this.deleteUser(username);
        this.users.set(username, newUser);
    }

    async isEnabled(username: string): Promise<boolean> {
        const storedUser: AuthenticationUser =  await this.loadUserByUsername(username);
        if (!storedUser)
            return false;
        return Promise.resolve( storedUser.isEnabled() );
    }

    //TODO: should be in abstract class
    async decrementAttemptsLeft(username: string) {
        const storedUser: AuthenticationUser =  await this.loadUserByUsername(username);
        let attempts = storedUser.getLoginAttemptsLeft();
        debug(`current num attempts: ${attempts}`);
        await this.setAttemptsLeft(username, --attempts);
    }

    async setAttemptsLeft(username: string, numAttemptsAllowed: number) {
        const storedUser: AuthenticationUser =  await this.loadUserByUsername(username);

        const newUser: AuthenticationUser = new AuthenticationUserImpl(
            username,
            storedUser.getPassword(),
            storedUser.isEnabled(),
            numAttemptsAllowed,
            storedUser.getPasswordLastChangeDate(),
            storedUser.getFirstName(),
            storedUser.getLastName(),
            storedUser.getAuthorities(),
            storedUser.getToken(),
            storedUser.getTokenDate()
        );

        //delete old user and set a new one, since iface does not support "setPassword()":
        this.deleteUser(username);
        this.users.set(username, newUser);
    }

    async setPassword(username: string, newPassword: string) {
        const storedUser: AuthenticationUser =  await this.loadUserByUsername(username);

        const newUser: AuthenticationUser = new AuthenticationUserImpl(
            username,
            newPassword,
            storedUser.isEnabled(),
            storedUser.getLoginAttemptsLeft(),
            storedUser.getPasswordLastChangeDate(),
            storedUser.getFirstName(),
            storedUser.getLastName(),
            storedUser.getAuthorities(),
            null, null          //when resetting the password, delete the links so they become invalid.
        );

        //delete old user and set a new one, since iface does not support "setPassword()":
        this.deleteUser(username);
        this.users.set(username, newUser);
    }

    async getEncodedPassword(username: string): Promise<string> {
        const storedUser: AuthenticationUser =  await this.loadUserByUsername(username);
        if (!storedUser)
            return null;
        return Promise.resolve( storedUser.getPassword() );
    }

    async getPasswordLastChangeDate(username: string): Promise<Date> {
        const storedUser: AuthenticationUser =  await this.loadUserByUsername(username);
        return Promise.resolve( storedUser.getPasswordLastChangeDate() );
    }

    setAuthority(username: string, authority: string) {
        throw new Error("Method not implemented.");
    }

    async createUser(authenticationUser: AuthenticationUser): Promise<void> {
        debug('createUser / inmem implementation!');

        const newUser: AuthenticationUser = new AuthenticationUserImpl(authenticationUser.getUsername(),
            authenticationUser.getPassword(),
            false,
            authenticationUser.getLoginAttemptsLeft(),
            new Date(),
            authenticationUser.getFirstName(),
            authenticationUser.getLastName(),
            authenticationUser.getAuthorities(),
            authenticationUser.getToken(),
            authenticationUser.getTokenDate());

        if( await this.userExists( newUser.getUsername() ) )
        {
            //ALREADY_EXIST:
            throw new Error(`user ${newUser.getUsername()} already exists`);
        }

        this.users.set(newUser.getUsername(), newUser);
    }

    deleteUser(username: string): void {
        this.users.delete(username);
    }

    async userExists(username: string): Promise<boolean> {
        debug('userExists?');
        return Promise.resolve( this.users.has(username) );
    }

    async addLink(username: string, link: string) {
        const storedUser: AuthenticationUser =  await this.loadUserByUsername(username);

        const newUser: AuthenticationUser = new AuthenticationUserImpl(
            username,
            storedUser.getPassword(),
            storedUser.isEnabled(),
            storedUser.getLoginAttemptsLeft(),
            storedUser.getPasswordLastChangeDate(),
            storedUser.getFirstName(),
            storedUser.getLastName(),
            storedUser.getAuthorities(),
            link,
            new Date()
        );

        //delete old user and set a new one, since iface does not support "setPassword()":
        this.deleteUser(username);
        this.users.set(username, newUser);
    }

    /**
     * remove link
     * @param link
     */
    async removeLink(username: string): Promise<boolean> {
        const storedUser: AuthenticationUser =  await this.loadUserByUsername(username);

        if(!storedUser.getToken())
            return Promise.resolve( false );

        const newUser: AuthenticationUser = new AuthenticationUserImpl(
            username,
            storedUser.getPassword(),
            storedUser.isEnabled(),
            storedUser.getLoginAttemptsLeft(),
            storedUser.getPasswordLastChangeDate(),
            storedUser.getFirstName(),
            storedUser.getLastName(),
            storedUser.getAuthorities(),
            null
        );

        //delete old user and set a new one, since iface does not support "setPassword()":
        this.deleteUser(username);
        this.users.set(username, newUser);
        return Promise.resolve( true );
    }

    //this is for the automation only:
    async getLink(username: string): Promise<{ link: string; date: Date; }> {
        const storedUser: AuthenticationUser =  await this.loadUserByUsername(username);
        return Promise.resolve( {
            link: storedUser.getToken(),
            date: storedUser.getTokenDate()
        } );
    }

    /**
     * in real DB we will index also the link. In-mem impl just iterates over all entries.
     * @param link
     */
    getUsernameByLink(link: string): Promise<string> {
        for (let user of this.users.values()) {
            debug(`########### ${user.getToken()} vs ${link}`);
            if(user.getToken() === link)
                return Promise.resolve( user.getUsername() );
        }
        throw new Error("Could not find any user with this link.");
    }
}

import	React, {ReactElement}			from	'react';
import	axios							from	'axios';
import	NProgress						from	'nprogress';
import	{ethers}						from	'ethers';
import	* as useWatchTypes				from	'contexts/useWatch.d';
import	{useWeb3}						from	'@yearn/web-lib/contexts';
import	{useLocalStorage}				from	'@yearn/web-lib/hooks';
import	* as utils						from	'@yearn/web-lib/utils';
import	useSettings						from	'contexts/useSettings';
import	{getVaults}						from	'pages/api/getVaults';

const	WatchContext = React.createContext<useWatchTypes.TWatchContext>({
	vaults: [],
	lastUpdate: 0,
	isUpdating: false,
	network: {
		status: {
			rpc: 1,
			graph: 1,
			yearnApi: 1,
			yearnMeta: 1
		},
		blockNumber: 0,
		graphBlockNumber: 0,
		hasGraphIndexingErrors: false
	},
	update: (): void => undefined
});


/* 🔵 - Yearn Finance **********************************************************
** The watch context controls the different element responsible of making the
** data available for the app to use. This include fetching the vaults and
** strategies data directly from here and serving them to the whole app.
** In order to offload some work for the main UI thread, by default, the data
** fetching is performed by the serverless function through the following req:
** GET `/api/getVaults?chainID=${chainID}`
******************************************************************************/
type	TStorageVaults = [useWatchTypes.TVault[], (s: useWatchTypes.TVault[]) => useWatchTypes.TVault[]];
type	TStorageNetworkSync = [useWatchTypes.TNetworkData, (s: useWatchTypes.TNetworkData) => useWatchTypes.TNetworkData];
type	TStorageLastUpdate = [number, (s: number) => number];

export const WatchContextApp = ({children}: {children: ReactElement}): ReactElement => {
	const	{chainID} = useWeb3();
	const	{shouldUseRemoteFetch, rpcURI, subGraphURI} = useSettings();
	const	[vaults, set_vaults] = useLocalStorage('vaults', []) as TStorageVaults;
	const	[networkSync, set_networkSync] = useLocalStorage('networkSync', {}) as TStorageNetworkSync;
	const	[lastUpdate, set_lastUpdate] = useLocalStorage('vaultsLastUpdate', 0) as TStorageLastUpdate;
	const	[isUpdating, set_isUpdating] = React.useState<boolean>(false);
	const	getVaultIsRunning = React.useRef(false);
	const	getVaultRunNonce = React.useRef(0);

	React.useEffect((): void => {
		if (getVaultIsRunning.current) {
			getVaultIsRunning.current = false;
			getVaultRunNonce.current = getVaultRunNonce.current + 1;
		}
	}, [chainID]);

	/* 🔵 - Yearn Finance ******************************************************
	** In order to have all the data we need for the whole app, we need to
	** fetch them all at once. This will allow us to work with them, detect the
	** missing stuffs, parse some element and so on.
	** We can only get one run of getVaults at a time, to prevent multiple
	** useless and heavy calls, and a loading bar is triggering when the
	** process is starting.
	**************************************************************************/
	async function fetchVaults(chainID = 1, shouldRevalidate = false): Promise<void> {
		if (getVaultIsRunning.current) {
			return;
		}
		NProgress.start();
		getVaultIsRunning.current = true;
		const currentNonce = getVaultRunNonce.current;
		set_isUpdating(true);

		/* 🔵 - Yearn Finance ******************************************************
		** Data are dispatched between the different sources, and thus we need to
		** call them all to get the big picture:
		** - api.yearn.finance contains a lot of general data about the vaults
		** - meta.yearn.network is used to get the humanized name, the description
		**   and the protocols for each strategy. Data are localized.
		** - the subgraph allows us to get some missing data, like the reports, the
		**   apr etc.
		**************************************************************************/
		if (shouldUseRemoteFetch) {
			const	{data} = await axios.get(`/api/getVaults?chainID=${chainID || 1}&revalidate=${shouldRevalidate}`);
			//hack to get the bignumbers
			const	_vaultsInitials = JSON.parse(JSON.stringify(data.data.vaults), (_key: unknown, value: {type: string}): unknown => {
				if (value?.type === 'BigNumber') {
					return ethers.BigNumber.from(value);
				}
				return value;
			});
			

			getVaultIsRunning.current = false;
			if (getVaultRunNonce.current === currentNonce) {
				utils.performBatchedUpdates((): void => {
					set_vaults(_vaultsInitials);
					set_lastUpdate(Number(data.access));
					set_networkSync(data.data.network);
					set_isUpdating(false);
				});
			}
		} else {
			const	data = await getVaults(
				chainID || 1,
				true,
				rpcURI[chainID || 1],
				subGraphURI[chainID || 1]

			);
			//hack to get the bignumbers
			const	_vaultsInitials = JSON.parse(JSON.stringify(data.vaults), (_key: unknown, value: {type: string}): unknown => {
				if (value?.type === 'BigNumber') {
					return ethers.BigNumber.from(value);
				}
				return value;
			});

			getVaultIsRunning.current = false;
			if (getVaultRunNonce.current === currentNonce) {
				utils.performBatchedUpdates((): void => {
					set_vaults(_vaultsInitials);
					set_lastUpdate(new Date().valueOf());
					set_networkSync(data.network);
					set_isUpdating(false);
				});
			}
		}
		NProgress.done();
	}

	React.useEffect((): void => {
		fetchVaults(chainID);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [chainID]);

	return (
		<WatchContext.Provider
			value={{
				vaults,
				lastUpdate,
				isUpdating,
				network: networkSync,
				update: (): void => {
					fetchVaults(chainID, true);
				}
			}}>
			{children}
		</WatchContext.Provider>
	);
};

export const useWatch = (): useWatchTypes.TWatchContext => React.useContext(WatchContext);
export default useWatch;
